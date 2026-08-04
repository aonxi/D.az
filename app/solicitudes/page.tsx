import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";
import { StatusBadge } from "@/src/components/status-badge";
import { requests } from "@/src/data/mock-data";
import { requestStatusLabel } from "@/src/lib/format";

export const metadata: Metadata = { title: "Solicitudes" };

export default function RequestsPage() {
  return (
    <AppShell active="solicitudes" eyebrow="Entrada desde el QR" title="Solicitudes">
      <div className="toolbar">
        <label>Estado<select defaultValue="todas"><option value="todas">Todas</option><option>Nuevas</option><option>En revisión</option><option>Cotizadas primero</option></select></label>
        <label>Fecha<select><option>Más recientes</option><option>Más antiguas</option></select></label>
      </div>
      <div className="list-card">
        {requests.map((request) => (
          <Link className="list-row" href={`/solicitudes/${request.folio}`} key={request.folio}>
            <span className="list-main"><strong>{request.folio} · {request.clientName}</strong><small>{request.piece} · {request.requestedWork}</small></span>
            <span className="list-side"><StatusBadge label={requestStatusLabel[request.status]} tone={request.status} /><small>04 ago 2026</small></span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
