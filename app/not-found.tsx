import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><span className="eyebrow">404</span><h1>No encontramos esa pantalla</h1><p>El registro puede no existir dentro de los datos ficticios de la Etapa 1.</p><Link className="button button-primary" href="/">Volver al inicio</Link></main>;
}
