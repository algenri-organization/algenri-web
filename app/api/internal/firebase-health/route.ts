import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection("_system").doc("health").get();

    return Response.json({
      ok: true,
      firestore: "reachable",
      healthDocumentExists: snapshot.exists,
      projectId: process.env.GCP_PROJECT_ID ?? null,
    });
  } catch (error) {
    console.error("Firebase health check failed", error);

    return Response.json(
      {
        ok: false,
        firestore: "unreachable",
      },
      { status: 500 },
    );
  }
}
