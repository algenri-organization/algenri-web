import type { ReactNode } from "react";
import InternalAuthGate from "@/components/internal/internal-auth-gate";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function InternalLayout({ children }: { children: ReactNode }) {
  return <InternalAuthGate>{children}</InternalAuthGate>;
}
