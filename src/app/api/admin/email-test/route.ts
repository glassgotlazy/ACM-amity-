import { alertRecipients, emailConfigured, sendEmailDetailed } from "@/lib/email";
import { getSettings } from "@/lib/cms/read";
import { SITE_URL } from "@/lib/site";
import { handle } from "../cms/_handle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sends a test message to the ALERT_EMAIL_TO addresses (never anywhere else)
 * and reports exactly what happened, so email setup can be checked from the
 * admin instead of by submitting a fake application.
 */
export async function POST(request: Request) {
  return handle(request, "settings:write", async (session) => {
    const to = alertRecipients();
    const raw = (process.env.ALERT_EMAIL_TO ?? "").trim();
    if (!emailConfigured()) return { ok: false, to, error: "RESEND_API_KEY is not set in Vercel (or the site was not redeployed after adding it)." };
    if (!to.length) {
      return {
        ok: false,
        to,
        error: raw
          ? "ALERT_EMAIL_TO is set but does not contain a valid email address. Use a plain address like name@gmail.com."
          : "ALERT_EMAIL_TO is not set in Vercel (or the site was not redeployed after adding it).",
      };
    }
    const settings = await getSettings();
    const result = await sendEmailDetailed({
      to,
      subject: `Test email from ${settings.site_name}`,
      text: `This is a test sent by ${session.actor} from the admin (Emails page).\n\nNew-submission alerts will arrive at this address.\n\n${SITE_URL}/admin`,
    });
    return { ...result, to };
  });
}
