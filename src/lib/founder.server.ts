// Server-only founder identity. Never imported by client code, so the
// founder's email address never reaches the browser bundle.

const FOUNDER_EMAIL = "frontendabd03@gmail.com";

/** Display name shown to the founder (never an email address). */
export const FOUNDER_DISPLAY_NAME = "Founder Abdullah";

export function isFounderEmail(email: unknown): boolean {
  return typeof email === "string" && email.trim().toLowerCase() === FOUNDER_EMAIL;
}
