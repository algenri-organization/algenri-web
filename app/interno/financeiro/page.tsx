import FinanceAdminStable from "@/components/finance/finance-admin-stable";
import FinanceSettlementPanel from "@/components/finance/finance-settlement-panel";
import PartialPaymentPanel from "@/components/finance/partial-payment-panel";
import PaymentAdjustmentPanel from "@/components/finance/payment-adjustment-panel";
import RecurringSeriesPanel from "@/components/finance/recurring-series-panel";

export const metadata = {
  title: "Financeiro | ALGENRI",
  robots: { index: false, follow: false },
};

export default function FinancePage() {
  return <><FinanceAdminStable /><div className="bg-[#040c17] px-6 pb-10"><RecurringSeriesPanel /><PartialPaymentPanel /><PaymentAdjustmentPanel /><FinanceSettlementPanel /></div></>;
}
