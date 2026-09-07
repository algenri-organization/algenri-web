import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { createBriefingInstance, listBriefingInstances } from "@/lib/briefing/instance-store";
import { listClients, listProjects } from "@/lib/client-flow/store";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const clients = await listClients();
    const client = clients.find((item) => normalize(item.tradeName || item.legalName) === "teste ltda");
    if (!client) return Response.json({ ok: false, error: "teste_ltda_not_found" }, { status: 404 });

    const projects = await listProjects(client.id);
    const project = projects[0];
    if (!project) return Response.json({ ok: false, error: "teste_ltda_project_not_found" }, { status: 404 });

    const existing = await listBriefingInstances({ projectId: project.id });
    const current = existing.find((item) => item.templateSnapshot.name === "Briefing de Teste — Teste Ltda");
    if (current) {
      return Response.json({ ok: true, alreadyExists: true, instanceId: current.id, projectId: project.id });
    }

    const db = await getAdminDb();
    const templateRef = db.collection("briefing_templates").doc();
    const now = new Date().toISOString();
    const template = {
      id: templateRef.id,
      name: "Briefing de Teste — Teste Ltda",
      projectType: project.projectType || "teste-comercial",
      version: "1.0",
      privacyNoticeVersion: "1.0",
      status: "published",
      sections: [
        {
          id: "section-1-negocio",
          title: "Negócio e objetivos",
          order: 0,
          questions: [
            { id: "s1-q1-objetivo", label: "Qual é o principal objetivo deste projeto?", type: "long_text", required: true, order: 0 },
            { id: "s1-q2-publico", label: "Quem é o público principal que deverá utilizar a solução?", type: "long_text", required: true, order: 1 },
            { id: "s1-q3-problema", label: "Qual problema mais importante a empresa deseja resolver?", type: "long_text", required: true, order: 2 },
            { id: "s1-q4-prazo", label: "Existe uma data desejada para lançamento?", type: "date", required: false, order: 3 },
          ],
        },
        {
          id: "section-2-solucao",
          title: "Solução e funcionalidades",
          order: 1,
          questions: [
            { id: "s2-q1-canais", label: "Quais canais digitais a empresa utiliza atualmente?", type: "long_text", required: false, order: 0 },
            { id: "s2-q2-integracao", label: "A solução precisará integrar com algum sistema já utilizado pela empresa?", type: "yes_no", required: true, order: 1 },
            { id: "s2-q3-funcionalidades", label: "Quais funcionalidades considera indispensáveis na primeira versão?", type: "long_text", required: true, order: 2 },
            { id: "s2-q4-usuarios", label: "Quantos usuários internos deverão utilizar a solução?", type: "number", required: false, order: 3 },
          ],
        },
        {
          id: "section-3-comercial",
          title: "Expectativas comerciais e operação",
          order: 2,
          questions: [
            { id: "s3-q1-investimento", label: "Qual valor aproximado de investimento previsto para o projeto?", type: "currency", required: false, order: 0 },
            { id: "s3-q2-responsavel", label: "Quem será o responsável interno pelo acompanhamento do projeto?", type: "short_text", required: true, order: 1 },
            { id: "s3-q3-whatsapp", label: "Informe o WhatsApp do responsável pelo projeto.", type: "phone", required: false, order: 2 },
            { id: "s3-q4-observacoes", label: "Há alguma observação, referência ou expectativa adicional que devemos considerar?", type: "long_text", required: false, order: 3 },
          ],
        },
      ],
      source: {
        originalFileName: "briefing-teste-ltda-gerado-internamente.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sizeBytes: 0,
        storagePath: "",
        parser: "internal-test-seed",
        importedAt: now,
        warnings: ["Modelo criado exclusivamente para validação do fluxo comercial da ALGENRI."],
      },
      createdBy: user.email,
      createdAt: now,
      updatedAt: now,
    };

    await templateRef.set(template);

    const slugBase = `teste-ltda-${project.id.slice(0, 8)}-briefing-teste`;
    const { record, token } = await createBriefingInstance({
      templateId: templateRef.id,
      clientId: client.id,
      projectId: project.id,
      clientName: client.tradeName || client.legalName,
      projectName: project.name,
      slug: slugBase,
      createdBy: user.email,
    });

    const origin = new URL(request.url).origin;
    return Response.json({
      ok: true,
      alreadyExists: false,
      instanceId: record.id,
      projectId: project.id,
      accessUrl: `${origin}/briefing/${record.slug}?token=${encodeURIComponent(token)}`,
    }, { status: 201 });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Teste Ltda briefing seed failed", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "teste_ltda_briefing_seed_failed" }, { status: 500 });
  }
}
