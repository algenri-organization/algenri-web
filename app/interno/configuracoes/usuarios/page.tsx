import UserProfileAdmin from "@/components/internal/user-profile-admin";

export const metadata = {
  title: "Usuários e Acesso | ALGENRI",
  robots: { index: false, follow: false },
};

export default function UsersPage() {
  return <UserProfileAdmin />;
}
