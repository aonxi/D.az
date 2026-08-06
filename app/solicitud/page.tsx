import type { Metadata } from "next";
import { PublicShell } from "@/src/components/public-shell";
import { PublicRequestForm } from "@/src/features/requests/public-request-form";

export const metadata: Metadata = { title: "Enviar solicitud" };

export default function PublicRequestPage() {
  return (
    <PublicShell>
      <PublicRequestForm />
    </PublicShell>
  );
}
