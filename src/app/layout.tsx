import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "UniPortal — Campus Hub",
  description: "Your all-in-one university announcements & marketplace platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { fontFamily: "var(--font-body)", fontSize: "14px" },
              success: { iconTheme: { primary: "#0d9488", secondary: "#fff" } },
            }}
          />
          <Navbar />
          <main className="min-h-screen pt-16">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
