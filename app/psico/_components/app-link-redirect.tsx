"use client";

import { useEffect } from "react";

type AppLinkRedirectProps = {
  title: string;
  description: string;
  deepLink: string;
};

export default function AppLinkRedirect({
  title,
  description,
  deepLink,
}: AppLinkRedirectProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = deepLink;
    }, 250);

    return () => window.clearTimeout(timer);
  }, [deepLink]);

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
      <section className="glass w-full max-w-xl rounded-[32px] p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Psico ALGENRI
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 leading-7 text-white/60">{description}</p>

        <a
          href={deepLink}
          className="button-primary mt-8 inline-flex justify-center"
        >
          Abrir no Psico ALGENRI
        </a>

        <p className="mt-5 text-sm leading-6 text-white/40">
          Se o app não abrir automaticamente, use o botão acima.
        </p>

        <a
          href="/psico-algenri"
          className="mt-5 inline-block text-sm font-medium text-cyan-300 hover:text-cyan-200"
        >
          Conhecer o Psico ALGENRI
        </a>
      </section>
    </main>
  );
}
