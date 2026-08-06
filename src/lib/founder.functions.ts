import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Tells the client whether the signed-in user is the founder.
 * The founder's email is never returned — only a boolean and a display name.
 */
export const getFounderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { isFounderEmail, FOUNDER_DISPLAY_NAME } = await import("./founder.server");
    const isFounder = isFounderEmail(context.claims["email"]);
    return {
      isFounder,
      displayName: isFounder ? FOUNDER_DISPLAY_NAME : null,
    };
  });
