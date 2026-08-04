import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

const routes = [
  ["/", /Inicio/],
  ["/solicitud", /Cuéntanos qué trabajo necesitas/],
  ["/solicitud/confirmacion", /Solicitud recibida/],
  ["/login", /Acceder a TallerFlow/],
  ["/solicitudes", /Entrada desde el QR/],
  ["/solicitudes/SOL-2026-0014", /Datos enviados por el cliente/],
  ["/trabajos", /Cola operativa/],
  ["/trabajos/OT-2026-0008", /Soporte de motor/],
  ["/cotizaciones", /Documentos comerciales/],
  ["/cotizaciones/COT-2026-0001", /COTIZACIÓN/],
  ["/clientes", /Datos ficticios/],
  ["/mas", /Exportar trabajos CSV/],
];

for (const [pathname, expected] of routes) {
  test(`renderiza ${pathname} con contenido de demostración`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    const html = await response.text();
    assert.match(html, expected);
    assert.match(html, /Etapa 2/);
    assert.match(html, /datos ficticios/i);
    assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
  });
}

test("mantiene las decisiones aprobadas en un único archivo", async () => {
  const config = await readFile(new URL("../src/config/taller.config.ts", import.meta.url), "utf8");
  assert.match(config, /preciosSonNetos:\s*true/);
  assert.match(config, /tasaIvaPredeterminada:\s*19/);
  assert.match(config, /vigenciaDias:\s*30/);
  assert.match(config, /cantidadesSoloEnteras:\s*true/);
  assert.match(config, /entregaObligatoria:\s*false/);
  assert.match(config, /Sin fecha comprometida/);
  assert.doesNotMatch(config, /password|service_role|secret/i);
});

test("la Etapa 2 no activa una base de datos de producción", async () => {
  const hosting = JSON.parse(await readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"));
  assert.equal(hosting.d1, null);
  assert.equal(hosting.r2, null);
});
