import Link from "next/link";
import type { ReactNode } from "react";
import { StageNotice } from "@/src/components/stage-notice";

export function PublicShell({ children }: { children: ReactNode }) {
  return <div className="public-root"><StageNotice /><header className="public-header"><Link className="brand" href="/solicitud"><span className="brand-mark">TF</span><span><strong>Taller Demo</strong><small>Solicitud de trabajo</small></span></Link><Link href="/login">Acceso administrador</Link></header><main className="public-main">{children}</main></div>;
}
