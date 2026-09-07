import type { ReactNode } from "react";
import InternalAuthGate from "@/components/internal/internal-auth-gate";
import InternalSidebar from "@/components/internal/internal-sidebar";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function InternalLayout({ children }: { children: ReactNode }) {
  return (
    <InternalAuthGate>
      <div className="flex min-h-screen bg-[#040c17]">
        <InternalSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </InternalAuthGate>
  );
}
