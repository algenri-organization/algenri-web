export type BankingProviderStatus = {
  provider: "c6" | "cora";
  label: string;
  configured: boolean;
  mode: "manual" | "credentials-ready";
  missing: string[];
};

function envPresent(name: string) { return Boolean(process.env[name]?.trim()); }

export function getBankingStatus(): BankingProviderStatus[] {
  const providers = [
    { provider: "c6" as const, label: "C6 Bank", vars: ["C6_CLIENT_ID", "C6_CLIENT_SECRET"] },
    { provider: "cora" as const, label: "Cora", vars: ["CORA_CLIENT_ID", "CORA_CLIENT_SECRET"] },
  ];
  return providers.map(({ provider, label, vars }) => {
    const missing = vars.filter((name) => !envPresent(name));
    return { provider, label, configured: missing.length === 0, mode: missing.length === 0 ? "credentials-ready" : "manual", missing };
  });
}
