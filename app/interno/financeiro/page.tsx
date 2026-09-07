import FinanceAdmin from "@/components/finance/finance-admin";

export const metadata = {
  title: "Financeiro | ALGENRI",
  robots: { index: false, follow: false },
};

export default function FinancePage() {
  return <FinanceAdmin />;
}
