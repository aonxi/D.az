import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TallerFlow",
    template: "%s · TallerFlow",
  },
  description: "Prototipo navegable del sistema de gestión para taller.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  );
}
