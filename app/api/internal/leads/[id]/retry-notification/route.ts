import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { recordExternalAutomationEvent } from "@/lib/automations/events";
import { getCommercialLead, markLeadNotificationRetry, updateLeadNotification } from "@/lib/leads/store";
import { sendLeadWhatsAppNotification } from "@/lib/whatsapp/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { id } = await params;
    const lead = await getCommercialLead(id);
    if (!lead) return Response.json({ ok: false, error: "lead_not_found" }, { status: 404 });

    const eligible = lead.notificationStatus === "failed" || lead.notificationDeliveryStatus === "failed";
    if (!eligible) return Response.json({ ok: false, error: "retry_not_allowed" }, { status: 409 });

    await markLeadNotificationRetry(id);
    const notification = await sendLeadWhatsAppNotification(lead);
    await updateLeadNotification(id, notification.status, notification.error ?? null, notification.messageId ?? null);
    await recordExternalAutomationEvent({
      kind: "new_lead_notification_retry",
      channel: "whatsapp",
      status: notification.status,
      provider: "meta",
      entityType: "lead",
      entityId: lead.id,
      providerMessageId: notification.messageId ?? null,
      error: notification.error ?? null,
    }).catch((error) => console.error("External automation retry event log failed", error));

    return Response.json({
      ok: true,
      notificationStatus: notification.status,
      messageId: notification.messageId ?? null,
      requestedBy: user.email,
    });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("Lead notification retry failed", error);
    return Response.json({ ok: false, error: "lead_notification_retry_failed" }, { status: 500 });
  }
}
