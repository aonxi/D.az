import { clients as demoClients } from "@/src/data/mock-data";
import { isDemoMode } from "@/src/lib/supabase/config";
import { createSupabaseServerClient, requireAdminSession } from "@/src/lib/supabase/server";
import type { Client } from "@/src/types/domain";

type ClientRow = {
  id: string;
  tipo: "persona" | "empresa";
  nombre_razon_social: string;
  rut: string | null;
  persona_contacto: string | null;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  notas: string | null;
};

export type ClientRepositoryResult<T> = {
  data: T;
  isDemo: boolean;
  errorReference?: string;
};

function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    type: row.tipo,
    name: row.nombre_razon_social,
    rut: row.rut ?? undefined,
    contact: row.persona_contacto ?? undefined,
    phone: row.telefono,
    email: row.correo ?? undefined,
    address: row.direccion ?? undefined,
    notes: row.notas ?? undefined,
  };
}

export async function listClients(): Promise<ClientRepositoryResult<Client[]>> {
  await requireAdminSession();

  if (isDemoMode()) return { data: demoClients, isDemo: true };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id,tipo,nombre_razon_social,rut,persona_contacto,telefono,correo,direccion,notas")
    .is("archived_at", null)
    .order("nombre_razon_social")
    .limit(250);

  if (error) {
    const errorReference = crypto.randomUUID();
    console.error("admin_client_list_failed", { errorReference, code: error.code });
    return { data: [], isDemo: false, errorReference };
  }

  return { data: (data as ClientRow[]).map(mapClient), isDemo: false };
}

function comparable(value?: string) {
  return value?.toLowerCase().replace(/[^0-9a-záéíóúñk]/g, "") ?? "";
}

export function suggestClientId(
  request: { possibleClientId?: string; phone: string; rut?: string },
  clients: Client[],
) {
  if (request.possibleClientId && clients.some((client) => client.id === request.possibleClientId)) {
    return request.possibleClientId;
  }

  const rut = comparable(request.rut);
  const phone = comparable(request.phone);
  return clients.find((client) => (rut && comparable(client.rut) === rut) || comparable(client.phone) === phone)?.id;
}
