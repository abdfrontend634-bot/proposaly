import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/webhooks/lemon-squeezy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-signature") ?? "";
        const body = await request.text();
        const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

        if (!secret) {
          console.error("LEMON_SQUEEZY_WEBHOOK_SECRET is not configured");
          return new Response("Webhook secret not configured", { status: 500 });
        }

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);

        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: Record<string, any>;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const eventName = payload.meta?.event_name as string | undefined;
        const custom = payload.meta?.custom_data as Record<string, any> | undefined;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const subscriptionEvents = [
          "subscription_created",
          "subscription_updated",
          "subscription_cancelled",
          "subscription_resumed",
          "subscription_expired",
          "subscription_payment_success",
          "subscription_payment_failed",
          "subscription_payment_recovered",
        ];

        if (!eventName || !subscriptionEvents.includes(eventName)) {
          return new Response("ok");
        }

        const data = payload.data ?? {};
        const attributes = data.attributes ?? {};
        const relationships = data.relationships ?? {};
        const subscriptionId = data.id as string | undefined;
        const customerId = relationships.customer?.data?.id as string | undefined;
        const variantId = relationships.variant?.data?.id as string | undefined;
        const orderId = relationships.order?.data?.id as string | undefined;

        let userId = custom?.user_id as string | undefined;

        if (!userId && customerId) {
          const { data: existing } = await supabaseAdmin
            .from("subscriptions")
            .select("user_id")
            .eq("ls_customer_id", customerId)
            .single();
          if (existing) userId = existing.user_id;
        }

        if (!userId) {
          console.warn("Lemon Squeezy webhook: no user_id found", { eventName, subscriptionId });
          return new Response("ok");
        }

        const statusMap: Record<string, string> = {
          subscription_created: "active",
          subscription_updated: "active",
          subscription_resumed: "active",
          subscription_payment_success: "active",
          subscription_payment_recovered: "active",
          subscription_cancelled: "cancelled",
          subscription_expired: "expired",
          subscription_payment_failed: "past_due",
        };

        const status = statusMap[eventName] ?? attributes.status ?? "active";
        const currentPeriodEnd = attributes.current_period_end ?? null;
        const renewsAt = attributes.renews_at ?? null;
        const endsAt = attributes.ends_at ?? null;
        const cancelled = eventName === "subscription_cancelled" || status === "cancelled";

        const upsertData = {
          user_id: userId,
          status,
          plan: "pro",
          ls_subscription_id: subscriptionId,
          ls_customer_id: customerId,
          ls_variant_id: variantId,
          ls_order_id: orderId,
          current_period_end: currentPeriodEnd,
          renews_at: renewsAt,
          ends_at: endsAt,
          cancelled,
        };

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .upsert(upsertData, { onConflict: "user_id" });

        if (error) {
          console.error("Failed to upsert subscription:", error);
          return new Response("Failed to update subscription", { status: 500 });
        }

        try {
          if (customerId) {
            const customer = await lsCustomer(customerId);
            const portalUrl = customer?.urls?.customer_portal ?? null;
            const updateUrl = customer?.urls?.customer_portal ?? null;
            if (portalUrl) {
              await supabaseAdmin
                .from("subscriptions")
                .update({ customer_portal_url: portalUrl, update_payment_method_url: updateUrl })
                .eq("user_id", userId);
            }
          }
        } catch (err) {
          console.error("Failed to update portal URLs:", err);
        }

        return new Response("ok");
      },
    },
  },
});

async function lsCustomer(customerId: string) {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) return null;
  const response = await fetch(`https://api.lemonsqueezy.com/v1/customers/${customerId}`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!response.ok) return null;
  const json = await response.json();
  return json.data?.attributes as { urls?: { customer_portal?: string } } | null;
}
