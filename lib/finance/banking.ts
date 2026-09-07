export type BankingProviderStatus = {
  provider: "c6" | "cora";
  label: string;
  configured: boolean;
  mode: "manual";
  missing: string[];
  status: "requested" | "deferred";
  detail: string;
};

export function getBankingStatus(): BankingProviderStatus[] {
  return [
    {
      provider: "c6",
      label: "C6 Bank — aguardando retorno",
      configured: false,
      mode: "manual",
      missing: [],
      status: "requested",
      detail: "Integração solicitada ao C6. API, homologação e credenciais ainda precisam ser confirmadas pelo banco.",
    },
    {
      provider: "cora",
      label: "Cora — integração adiada",
      configured: false,
      mode: "manual",
      missing: [],
      status: "deferred",
      detail: "Integração mantida como alternativa futura e não será ativada nesta fase.",
    },
  ];
}
