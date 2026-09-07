import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { listCommercialLeads } from "@/lib/leads/store";
import { listProjects } from "@/lib/client-flow/store";
import { listProjectDossiers } from "@/lib/dossiers/store";
import { listCommercialProposals } from "@/lib/proposals/store";
import { listContracts } from "@/lib/contracts/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPEN_PROPOSAL_STATUSES = new Set(["draft", "in_review", "ready_to_send", "sent", "negotiation"]);
const ACTIVE_PROJECT_STATUSES = new Set(["diagnosis", "briefing", "proposal", "contract", "onboarding", "development", "validation", "publication", "delivery", "support"]);
const DELIVERY_PROJECT_STATUSES = new Set(["onboarding", "development", "validation", "publication", "delivery", "support"]);

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);

    const [leads, projects, dossiers, proposals, contracts] = await Promise.all([
      listCommercialLeads(100),
      listProjects(),
      listProjectDossiers(),
      listCommercialProposals(),
      listContracts(),
    ]);

    const activeLeads = leads.filter((lead) => lead.status !== "archived");
    const newLeads = leads.filter((lead) => lead.status === "new");
    const activeProjects = projects.filter((project) => ACTIVE_PROJECT_STATUSES.has(project.status) && !project.archivedAt);
    const deliveryProjects = projects.filter((project) => DELIVERY_PROJECT_STATUSES.has(project.status) && !project.archivedAt);
    const activeDossiers = dossiers.filter((dossier) => dossier.status !== "archived");
    const openProposals = proposals.filter((proposal) => OPEN_PROPOSAL_STATUSES.has(proposal.status));
    const proposalsAwaitingDecision = proposals.filter((proposal) => proposal.status === "sent" || proposal.status === "negotiation");
    const activeContracts = contracts.filter((contract) => contract.status !== "cancelled");
    const contractsPending = contracts.filter((contract) => contract.status === "draft" || contract.status === "awaiting_signature");

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const agenda = activeProjects
      .filter((project) => project.expectedDeliveryDate)
      .map((project) => ({
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        status: project.status,
        expectedDeliveryDate: project.expectedDeliveryDate,
        dueAt: new Date(`${project.expectedDeliveryDate}T12:00:00`).getTime(),
      }))
      .filter((item) => Number.isFinite(item.dueAt))
      .sort((a, b) => a.dueAt - b.dueAt)
      .slice(0, 6)
      .map((item) => ({ ...item, overdue: item.dueAt < todayStart }));

    const overdueProjects = agenda.filter((item) => item.overdue).length;

    return Response.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      cards: {
        interested: activeLeads.length,
        newInterested: newLeads.length,
        openProposals: openProposals.length,
        pendingContracts: contractsPending.length,
        activeProjects: activeProjects.length,
      },
      pipeline: {
        interested: activeLeads.length,
        briefing: projects.filter((project) => project.status === "briefing" && !project.archivedAt).length,
        dossier: activeDossiers.length,
        proposal: openProposals.length,
        contract: activeContracts.length,
        project: deliveryProjects.length,
      },
      attention: {
        newLeads: newLeads.length,
        proposalsAwaitingDecision: proposalsAwaitingDecision.length,
        contractsPending: contractsPending.length,
        overdueProjects,
      },
      agenda,
    });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Dashboard summary load failed", error);
    return Response.json({ ok: false, error: "dashboard_summary_failed" }, { status: 500 });
  }
}
