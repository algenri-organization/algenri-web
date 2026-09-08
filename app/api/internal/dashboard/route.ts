import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { listCommercialLeads } from "@/lib/leads/store";
import { listProjects } from "@/lib/client-flow/store";
import { listProjectDossiers } from "@/lib/dossiers/store";
import { listCommercialProposals } from "@/lib/proposals/store";
import { listContracts } from "@/lib/contracts/store";
import { getInternalAccess } from "@/lib/internal/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPEN_PROPOSAL_STATUSES = new Set(["draft", "in_review", "ready_to_send", "sent", "negotiation"]);
const ACTIVE_PROJECT_STATUSES = new Set(["diagnosis", "briefing", "proposal", "contract", "onboarding", "development", "validation", "publication", "delivery", "support"]);
const DELIVERY_PROJECT_STATUSES = new Set(["onboarding", "development", "validation", "publication", "delivery", "support"]);

export async function GET(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const access = await getInternalAccess(user.uid, user.email);
    const canCommercial = access.permissions.includes("commercial");
    const canOperation = access.permissions.includes("operation");
    const canFinance = access.permissions.includes("finance");
    const canSettings = access.permissions.includes("settings");

    const leads = canCommercial ? await listCommercialLeads(100) : [];
    const projects = canCommercial || canOperation ? await listProjects() : [];
    const dossiers = canOperation ? await listProjectDossiers() : [];
    const proposals = canCommercial ? await listCommercialProposals() : [];
    const contracts = canCommercial ? await listContracts() : [];

    const activeLeads = canCommercial ? leads.filter((lead) => lead.status !== "archived") : [];
    const newLeads = canCommercial ? leads.filter((lead) => lead.status === "new") : [];
    const activeProjects = canCommercial ? projects.filter((project) => ACTIVE_PROJECT_STATUSES.has(project.status) && !project.archivedAt) : [];
    const deliveryProjects = canCommercial ? projects.filter((project) => DELIVERY_PROJECT_STATUSES.has(project.status) && !project.archivedAt) : [];
    const activeDossiers = canOperation ? dossiers.filter((dossier) => dossier.status !== "archived") : [];
    const openProposals = canCommercial ? proposals.filter((proposal) => OPEN_PROPOSAL_STATUSES.has(proposal.status)) : [];
    const proposalsAwaitingDecision = canCommercial ? proposals.filter((proposal) => proposal.status === "sent" || proposal.status === "negotiation") : [];
    const activeContracts = canCommercial ? contracts.filter((contract) => contract.status !== "cancelled") : [];
    const contractsPending = canCommercial ? contracts.filter((contract) => contract.status === "draft" || contract.status === "awaiting_signature") : [];

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const agenda = canCommercial
      ? activeProjects
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
          .map((item) => ({ ...item, overdue: item.dueAt < todayStart }))
      : [];

    const overdueProjects = canCommercial ? agenda.filter((item) => item.overdue).length : 0;

    return Response.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      access: {
        commercial: canCommercial,
        operation: canOperation,
        finance: canFinance,
        settings: canSettings,
      },
      cards: {
        interested: canCommercial ? activeLeads.length : 0,
        newInterested: canCommercial ? newLeads.length : 0,
        openProposals: canCommercial ? openProposals.length : 0,
        pendingContracts: canCommercial ? contractsPending.length : 0,
        activeProjects: canCommercial ? activeProjects.length : 0,
      },
      pipeline: {
        interested: canCommercial ? activeLeads.length : 0,
        briefing: canOperation ? projects.filter((project) => project.status === "briefing" && !project.archivedAt).length : 0,
        dossier: canOperation ? activeDossiers.length : 0,
        proposal: canCommercial ? openProposals.length : 0,
        contract: canCommercial ? activeContracts.length : 0,
        project: canCommercial ? deliveryProjects.length : 0,
      },
      attention: {
        newLeads: canCommercial ? newLeads.length : 0,
        proposalsAwaitingDecision: canCommercial ? proposalsAwaitingDecision.length : 0,
        contractsPending: canCommercial ? contractsPending.length : 0,
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
