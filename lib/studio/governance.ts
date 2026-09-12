import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export const STUDIO_ROUTING_POLICY_VERSION = "2026.09.v1";

export type StudioGovernanceEvent = {
  type: string;
  actorUid?: string | null;
  actorEmail?: string | null;
  source?: string | null;
  summary: string;
  details?: Record<string, unknown>;
};

export async function recordStudioGovernanceEvent(projectId: string, event: StudioGovernanceEvent) {
  const db = await getAdminDb();
  const ref = db.collection("studioProjects").doc(projectId).collection("governanceEvents").doc();
  await ref.set({
    ...event,
    actorUid: event.actorUid ?? null,
    actorEmail: event.actorEmail ?? null,
    source: event.source ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function listStudioGovernanceEvents(projectId: string, limit = 120) {
  const db = await getAdminDb();
  const snapshot = await db.collection("studioProjects").doc(projectId).collection("governanceEvents").orderBy("createdAt", "desc").limit(limit).get();
  return snapshot.docs.map(doc => {
    const data = doc.data() as Record<string, any>;
    const createdAt = typeof data.createdAt?.toDate === "function" ? data.createdAt.toDate().toISOString() : data.createdAt ?? null;
    return { id: doc.id, ...data, createdAt };
  });
}
