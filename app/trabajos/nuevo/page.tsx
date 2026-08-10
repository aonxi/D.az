import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";
import { listClients } from "@/src/features/clients/repository";
import { WorkOrderForm } from "@/src/features/work-orders/work-order-form";
import { todayInChile } from "@/src/lib/date";

export const metadata: Metadata = { title: "Nuevo trabajo" };

export default async function NewWorkOrderPage() {
  const clientsResult = await listClients();

  return (
    <AppShell active="trabajos" eyebrow="Orden de trabajo manual" title="Nuevo trabajo">
      <div className="notice-box"><strong>Para trabajos presenciales, telefónicos o de WhatsApp</strong><span>Busca primero al cliente para evitar duplicados. La OT recibirá su folio al guardarse.</span></div>
      {clientsResult.errorReference && <p className="form-message error" role="alert">No pudimos cargar los clientes existentes. Puedes crear uno nuevo. Código: {clientsResult.errorReference}</p>}
      <WorkOrderForm
        cancelHref="/trabajos"
        clients={clientsResult.data}
        endpoint="/api/admin/trabajos"
        receivedDate={todayInChile()}
        submitLabel="Guardar orden de trabajo"
      />
    </AppShell>
  );
}
