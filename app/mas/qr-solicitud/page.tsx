import type { Metadata } from "next";
import { headers } from "next/headers";
import { AppShell } from "@/src/components/app-shell";
import { RequestQr } from "@/src/features/requests/request-qr";

export const metadata: Metadata = { title: "QR de solicitud" };
export const dynamic = "force-dynamic";

async function getRequestUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  try {
    if (configured) return new URL("/solicitud", configured).toString();
  } catch {}

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (host) {
    const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${protocol}://${host}/solicitud`;
  }

  return "http://localhost:3000/solicitud";
}

export default async function RequestQrPage() {
  const url = await getRequestUrl();
  return (
    <AppShell active="mas" eyebrow="Herramientas" title="QR de solicitud">
      <RequestQr isLocal={new URL(url).hostname === "localhost"} url={url} />
    </AppShell>
  );
}
