import FinanceAdminStable from "@/components/finance/finance-admin-stable";
import FinanceSettlementPanel from "@/components/finance/finance-settlement-panel";

export const metadata = {
  title: "Financeiro | ALGENRI",
  robots: { index: false, follow: false },
};

export default function FinancePage() {
  return <><FinanceAdminStable /><FinanceSettlementPanel /></>;
}
