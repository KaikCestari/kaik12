import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "./pwa-register";

export const metadata: Metadata = {
  title: "Sabom | Pedidos",
  description: "Gestão de mesas e pedidos para lanchonetes",
  manifest: "/manifest.webmanifest",
  applicationName: "Sabom",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Sabom" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2449d8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><PwaRegister />{children}</body>
    </html>
  );
}
