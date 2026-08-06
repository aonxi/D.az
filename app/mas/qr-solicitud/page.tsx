import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";
import { RequestQr } from "@/src/features/requests/request-qr";

export const metadata: Metadata = { title: "QR de solicitud" };

function getRequestUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    return new URL("/solicitud", configured).toString();
  } catch {
    return "http://localhost:3000/solicitud";
  }
}

export default function RequestQrPage() {
  const url = getRequestUrl();
  return (
    <AppShell active="mas" eyebrow="Herramientas" title="QR de solicitud">
      <RequestQr isLocal={new URL(url).hostname === "localhost"} url={url} />
    </AppShell>
  );
}
