import type { CommercialLead } from "@/lib/leads/store";

function cleanPhone(value: string | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function buildProspectWhatsAppUrl(lead: CommercialLead) {
  const number = cleanPhone(process.env.ALGENRI_WHATSAPP_PUBLIC_NUMBER);
  if (!number) return null;

  const text = [
    `Olá! Sou ${lead.name}${lead.company ? `, da ${lead.company}` : ""}.`,
    `Tenho interesse em: ${lead.interest}.`,
    lead.message ? `Contexto: ${lead.message}` : "",
    `Meu WhatsApp: ${lead.whatsapp}.`,
  ].filter(Boolean).join("\n");

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export async function sendLeadWhatsAppNotification(lead: CommercialLead) {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const recipient = cleanPhone(process.env.ALGENRI_WHATSAPP_NOTIFY_NUMBER);
  const templateName = process.env.META_WHATSAPP_LEAD_TEMPLATE_NAME?.trim();
  const templateLanguage = process.env.META_WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "pt_BR";
  const apiVersion = process.env.META_WHATSAPP_API_VERSION || "v23.0";

  const missing = [
    !token ? "META_WHATSAPP_ACCESS_TOKEN" : "",
    !phoneNumberId ? "META_WHATSAPP_PHONE_NUMBER_ID" : "",
    !recipient ? "ALGENRI_WHATSAPP_NOTIFY_NUMBER" : "",
    !templateName ? "META_WHATSAPP_LEAD_TEMPLATE_NAME" : "",
  ].filter(Boolean);

  if (missing.length) {
    return { status: "skipped" as const, error: `whatsapp_notification_not_configured:${missing.join(",")}`, messageId: null };
  }

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: lead.name },
            { type: "text", text: lead.company },
            { type: "text", text: lead.whatsapp },
          ],
        },
      ],
    },
  };

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payloadText = await response.text();
    if (!response.ok) {
      return { status: "failed" as const, error: `meta_whatsapp_${response.status}:${payloadText.slice(0, 800)}`, messageId: null };
    }

    let messageId: string | null = null;
    try {
      const payload = JSON.parse(payloadText) as { messages?: Array<{ id?: string }> };
      messageId = payload.messages?.[0]?.id ?? null;
    } catch {}

    return { status: "sent" as const, error: null, messageId };
  } catch (error) {
    return { status: "failed" as const, error: error instanceof Error ? error.message : "meta_whatsapp_request_failed", messageId: null };
  }
}
