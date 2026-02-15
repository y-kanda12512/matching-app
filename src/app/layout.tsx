import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MatchApp",
  description: "マッチングアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} antialiased`}>
        <AuthProvider>
          <Header />
          <main className="mx-auto max-w-2xl px-4 pb-20 pt-4">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
