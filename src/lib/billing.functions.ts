import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestUrl } from "@tanstack/react-start/server";

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

async function lsFetch(path: string, options: RequestInit = {}) {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) throw new Error("LEMON_SQUEEZY_API_KEY is not configured");

  const response = await fetch(`${LS_API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Lemon Squeezy API error (${response.status}): ${text.slice(0, 500)}`);
  }

  return response.json();
}

export type SubscriptionStatus = {
  plan: "free" | "pro";
  status: string;
  currentPeriodEnd: string | null;
  customerPortalUrl: string | null;
  updatePaymentMethodUrl: string | null;
  isPro: boolean;
};

export const getSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionStatus> => {
    const { data, error } = await context.supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", context.userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to read subscription: ${error.message}`);
    }

    const activeStatuses = ["active", "trialing", "past_due"];
    const isPro = !!data && activeStatuses.includes(data.status);

    return {
      plan: isPro ? "pro" : "free",
      status: data?.status ?? "inactive",
      currentPeriodEnd: data?.current_period_end ?? null,
      customerPortalUrl: data?.customer_portal_url ?? null,
      updatePaymentMethodUrl: data?.update_payment_method_url ?? null,
      isPro,
    };
  });

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;

    if (!storeId || !variantId) {
      throw new Error("LEMON_SQUEEZY_STORE_ID or LEMON_SQUEEZY_VARIANT_ID is not configured");
    }

    const { data: userData } = await context.supabase.auth.getUser();
    const email = userData.user?.email;
    const origin = getRequestUrl().origin;

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_options: {
            embed: false,
            media: false,
            logo: true,
          },
          checkout_data: {
            email: email ?? undefined,
            custom: {
              user_id: context.userId,
            },
          },
          product_options: {
            redirect_url: `${origin}/dashboard?checkout=success`,
            receipt_link_url: `${origin}/dashboard?checkout=success`,
            enabled_variants: [variantId],
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    };

    const json = await lsFetch("/checkouts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const url = json.data?.attributes?.url;
    if (!url) throw new Error("Checkout URL not returned from Lemon Squeezy");

    return { url };
  });

export const getCustomerPortalUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subscriptions")
      .select("customer_portal_url, ls_customer_id")
      .eq("user_id", context.userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to read subscription: ${error.message}`);
    }

    if (data?.customer_portal_url) {
      return { url: data.customer_portal_url };
    }

    if (!data?.ls_customer_id) {
      throw new Error("No active subscription to manage");
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    if (!apiKey) throw new Error("LEMON_SQUEEZY_API_KEY is not configured");

    const customer = await lsFetch(`/customers/${data.ls_customer_id}`);
    const url = customer.data?.attributes?.urls?.customer_portal;
    if (!url) throw new Error("Customer portal URL not available");

    return { url };
  });
