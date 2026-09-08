import NotificationPreferencesAdmin from "@/components/internal/notification-preferences-admin";

export const metadata = {
  title: "Notificações | ALGENRI",
  robots: { index: false, follow: false },
};

export default function NotificationsSettingsPage() {
  return <NotificationPreferencesAdmin />;
}
