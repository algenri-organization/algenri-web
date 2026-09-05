"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2, MessageCircle } from "lucide-react";

const interests = [
  "Site institucional",
  "Loja virtual / e-commerce",
  "Inteligência artificial",
  "Automação de processos",
  "WhatsApp inteligente",
  "Sistema personalizado",
  "Presença digital / SEO",
  "Outro",
];

export default function ContactLeadForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [whatsappUnavailable, setWhatsappUnavailable] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const popup = window.open("about:blank", "_blank");
    const form = event.currentTarget;
    const data = new FormData(form);

    setBusy(true);
    setDone(false);
    setWhatsappUnavailable(false);
    setMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          company: data.get("company"),
          whatsapp: data.get("whatsapp"),
          email: data.get("email"),
          interest: data.get("interest"),
          message: data.get("message"),
          consent: data.get("consent") === "on",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error("Não foi possível registrar seu contato agora.");

      setDone(true);
      form.reset();

      if (payload.whatsappUrl) {
        setMessage("Contato registrado. Abrindo o WhatsApp para continuar a conversa.");
        if (popup) {
          popup.location.replace(payload.whatsappUrl);
        } else {
          window.location.assign(payload.whatsappUrl);
        }
      } else {
        if (popup) popup.close();
        setWhatsappUnavailable(true);
        setMessage("Contato registrado com sucesso. O canal de WhatsApp da ALGENRI ainda precisa ser configurado; seu interesse já ficou salvo para atendimento.");
      }
    } catch (error) {
      if (popup) popup.close();
      setMessage(error instanceof Error ? error.message : "Falha ao registrar contato.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass rounded-[30px] p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05]">
          <MessageCircle className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <p className="text-sm font-medium text-cyan-200">Fale com um especialista</p>
          <h2 className="mt-1 text-2xl font-semibold">Conte rapidamente o que você precisa.</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">Registramos seu interesse primeiro e, em seguida, abrimos o WhatsApp com uma mensagem pronta para você continuar a conversa.</p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-white/65">Nome completo<input name="name" required className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3 text-white outline-none focus:border-cyan-300/50" /></label>
        <label className="text-sm text-white/65">Empresa<input name="company" required className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3 text-white outline-none focus:border-cyan-300/50" /></label>
        <label className="text-sm text-white/65">WhatsApp<input name="whatsapp" type="tel" required placeholder="(42) 99999-9999" className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3 text-white outline-none focus:border-cyan-300/50" /></label>
        <label className="text-sm text-white/65">E-mail <span className="text-white/35">(opcional)</span><input name="email" type="email" className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3 text-white outline-none focus:border-cyan-300/50" /></label>
        <label className="text-sm text-white/65 md:col-span-2">Principal interesse<select name="interest" required defaultValue="" className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3 text-white outline-none focus:border-cyan-300/50"><option value="" disabled>Selecione</option>{interests.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="text-sm text-white/65 md:col-span-2">Conte um pouco sobre sua necessidade <span className="text-white/35">(opcional)</span><textarea name="message" rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3 text-white outline-none focus:border-cyan-300/50" /></label>
      </div>

      <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-white/50">
        <input name="consent" type="checkbox" required className="mt-1" />
        <span>Autorizo a ALGENRI a utilizar estes dados para entrar em contato comigo sobre esta solicitação, conforme a finalidade informada.</span>
      </label>

      <button disabled={busy} className="button-primary mt-6 disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        {busy ? "Registrando…" : "Registrar e continuar no WhatsApp"}
      </button>

      {message && <p className={`mt-4 text-sm ${whatsappUnavailable ? "text-amber-200" : done ? "text-emerald-200" : "text-amber-200"}`}>{message}</p>}
    </form>
  );
}
