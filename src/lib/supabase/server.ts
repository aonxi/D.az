import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseConfig, hasSupabaseConfig, isDemoMode } from "@/src/lib/supabase/config";

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
};

export async function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // En componentes de servidor la renovación la realiza proxy.ts.
        }
      },
    },
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (isDemoMode()) {
    return {
      id: "demo-admin",
      email: "propietario@demo.local",
      name: "Propietario del taller",
      isDemo: true,
    };
  }

  if (!hasSupabaseConfig()) return null;

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const subject = claimsData?.claims?.sub;

  if (claimsError || !subject) return null;

  const { data: profile, error: profileError } = await supabase
    .from("perfiles_admin")
    .select("id,nombre,activo")
    .eq("id", subject)
    .eq("activo", true)
    .maybeSingle();

  if (profileError || !profile) return null;

  return {
    id: profile.id,
    email: typeof claimsData.claims.email === "string" ? claimsData.claims.email : "",
    name: profile.nombre,
    isDemo: false,
  };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (session) return session;

  redirect("/login");
}
