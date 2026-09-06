import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function configured(name: string) {
  return Boolean(process.env[name]?.trim());
}

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);

    const checks = {
      publicWhatsAppNumber: configured("ALGENRI_WHATSAPP_PUBLIC_NUMBER"),
      metaAccessToken: configured("META_WHATSAPP_ACCESS_TOKEN"),
      metaPhoneNumberId: configured("META_WHATSAPP_PHONE_NUMBER_ID"),
      notifyWhatsAppNumber: configured("ALGENRI_WHATSAPP_NOTIFY_NUMBER"),
      contactEmailPublished: true,
      privacyPolicyPublished: true,
    };

    const whatsappRedirectReady = checks.publicWhatsAppNumber;
    const whatsappNotificationReady = checks.metaAccessToken && checks.metaPhoneNumberId && checks.notifyWhatsAppNumber;
    const commercialLeadReady = whatsappRedirectReady && whatsappNotificationReady && checks.contactEmailPublished && checks.privacyPolicyPublished;

    return Response.json({
      ok: true,
      checks,
      summary: {
        whatsappRedirectReady,
        whatsappNotificationReady,
        commercialLeadReady,
      },
      note: "Este diagnóstico confirma presença de configuração no ambiente. A entrega real deve ser validada com um lead de teste pelo formulário público.",
    });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("Launch readiness check failed", error);
    return Response.json({ ok: false, error: "readiness_check_failed" }, { status: 500 });
  }
}
