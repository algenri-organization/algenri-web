export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/10">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 text-sm text-white/48 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/algenri-mark.svg" alt="" aria-hidden className="h-11 w-11 rounded-2xl border border-cyan-300/15" />
            <div>
              <p className="font-semibold tracking-[0.18em] text-white">ALGENRI</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/32">Soluções Digitais & IA</p>
            </div>
          </div>
          <p className="mt-4 max-w-md leading-6">Soluções digitais, inteligência artificial e automação para empresas que querem crescer com mais presença, eficiência e tecnologia.</p>
        </div>
        <div>
          <p className="font-medium text-white/75">Navegação</p>
          <div className="mt-3 flex flex-col gap-2">
            <a href="/solucoes" className="hover:text-white">Soluções</a>
            <a href="/planos" className="hover:text-white">Planos</a>
            <a href="/diagnostico" className="hover:text-white">Diagnóstico</a>
          </div>
        </div>
        <div>
          <p className="font-medium text-white/75">Contato</p>
          <div className="mt-3 flex flex-col gap-2">
            <a href="mailto:contato@algenri.com.br" className="hover:text-white">contato@algenri.com.br</a>
            <span>algenri.com.br</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-white/32 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} ALGENRI. Todos os direitos reservados.</span>
          <span>Tecnologia que impulsiona o seu amanhã.</span>
        </div>
      </div>
    </footer>
  );
}
