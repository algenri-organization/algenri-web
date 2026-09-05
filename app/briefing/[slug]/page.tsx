import PublicBriefingForm from "@/components/briefing/public-briefing-form";

export const metadata = {
  title: "Briefing | ALGENRI",
  robots: { index: false, follow: false },
};

export default async function BriefingPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ token?: string }> }) {
  const { slug } = await params;
  const { token = "" } = await searchParams;

  if (!token) {
    return <main className="min-h-screen bg-[#040c17] grid place-items-center px-6 text-center text-white"><div><p className="text-xs font-semibold tracking-[0.25em] text-cyan-300">ALGENRI CLIENT FLOW</p><h1 className="mt-3 text-2xl font-semibold">Link de briefing incompleto</h1><p className="mt-2 text-sm text-slate-400">Utilize o link individual enviado pela ALGENRI.</p></div></main>;
  }

  return <PublicBriefingForm slug={slug} token={token} />;
}
