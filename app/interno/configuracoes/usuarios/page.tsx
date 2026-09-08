import AccessAuditPanel from "@/components/internal/access-audit-panel";
import TeamAccessAdmin from "@/components/internal/team-access-admin";
import UserProfileAdmin from "@/components/internal/user-profile-admin";

export const metadata = {
  title: "Usuários e Acesso | ALGENRI",
  robots: { index: false, follow: false },
};

export default function UsersPage() {
  return <><UserProfileAdmin /><div className="mx-auto -mt-14 max-w-5xl px-5 pb-20 sm:px-6 lg:px-8"><TeamAccessAdmin /><AccessAuditPanel /></div></>;
}
