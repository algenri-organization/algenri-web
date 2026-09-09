import { recordExternalAutomationEvent } from "@/lib/automations/events";
import { createCommercialLead, updateLeadNotification } from "@/lib/leads/store";
import { buildProspectWhatsAppUrl, sendLeadWhatsAppNotification } from "@/lib/whatsapp/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = requiredString(body.name);
    const company = requiredString(body.company);
    const whatsapp = requiredString(body.whatsapp);
    const email = requiredString(body.email);
    const interest = requiredString(body.interest);
    const message = requiredString(body.message);
    const consent = body.consent === true;

    if (!name || !company || !whatsapp || !interest || !consent) {
      return Response.json({ ok: false, error: "missing_required_fields" }, { status: 400 });
    }

    const lead = await createCommercialLead({
      name,
      company,
      whatsapp,
      email,
      interest,
      message,
      source: "site-contato",
    });

    const whatsappUrl = buildProspectWhatsAppUrl(lead);
    const notification = await sendLeadWhatsAppNotification(lead);
    await updateLeadNotification(
      lead.id,
      notification.status,
      notification.error ?? null,
      notification.messageId ?? null,
    );
    await recordExternalAutomationEvent({
      kind: "new_lead_notification",
      channel: "whatsapp",
      status: notification.status,
      provider: "meta",
      entityType: "lead",
      entityId: lead.id,
      providerMessageId: notification.messageId ?? null,
      error: notification.error ?? null,
    }).catch((error) => console.error("External automation event log failed", error));

    return Response.json({
      ok: true,
      leadId: lead.id,
      whatsappUrl,
      notificationStatus: notification.status,
    }, { status: 201 });
  } catch (error) {
    console.error("Commercial lead creation failed", error);
    return Response.json({ ok: false, error: "lead_create_failed" }, { status: 500 });
  }
}
