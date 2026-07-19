import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { AppNavigation } from "@/components/app-navigation";

export const metadata = {
  title: "VI Guide",
  description: "Explore, plan, and move through the U.S. Virgin Islands.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <AppNavigation />
        </AuthProvider>
      </body>
    </html>
  );
}
