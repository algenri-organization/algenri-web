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
  const apiVersion = process.env.META_WHATSAPP_API_VERSION || "v23.0";

  if (!token || !phoneNumberId || !recipient) {
    return { status: "skipped" as const, error: "whatsapp_notification_not_configured" };
  }

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipient,
    type: "text",
    text: {
      preview_url: false,
      body: [
        "Novo interessado no site ALGENRI",
        `Nome: ${lead.name}`,
        `Empresa: ${lead.company}`,
        `WhatsApp: ${lead.whatsapp}`,
        lead.email ? `E-mail: ${lead.email}` : "",
        `Interesse: ${lead.interest}`,
        lead.message ? `Mensagem: ${lead.message}` : "",
        `Registro: ${lead.id}`,
      ].filter(Boolean).join("\n"),
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

    if (!response.ok) {
      const payload = await response.text();
      return { status: "failed" as const, error: `meta_whatsapp_${response.status}:${payload.slice(0, 500)}` };
    }

    return { status: "sent" as const, error: null };
  } catch (error) {
    return { status: "failed" as const, error: error instanceof Error ? error.message : "meta_whatsapp_request_failed" };
  }
}
