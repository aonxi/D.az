"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function RequestQr({ url, isLocal }: { url: string; isLocal: boolean }) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage("Enlace copiado.");
    } catch {
      setCopyMessage("No se pudo copiar automáticamente. Mantén presionado el enlace para copiarlo.");
    }
  }

  function downloadSvg() {
    const element = document.getElementById("request-qr-svg");
    if (!(element instanceof SVGElement)) return;
    const svg = new XMLSerializer().serializeToString(element);
    const objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "qr-solicitud-pruebas.svg";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <section className="panel-card qr-card">
      <div>
        <span className="eyebrow">QR de entorno de prueba</span>
        <h2>Formulario de solicitud</h2>
      </div>
      <div className="qr-code" aria-label={`Código QR para ${url}`}>
        <QRCodeSVG
          bgColor="#ffffff"
          fgColor="#162c49"
          id="request-qr-svg"
          includeMargin
          level="Q"
          size={260}
          title="Abrir formulario de solicitud"
          value={url}
        />
      </div>
      <a className="qr-url" href={url} rel="noreferrer" target="_blank">{url}</a>
      {isLocal && <p className="form-message error">Este QR apunta a `localhost` y solo funciona en este computador. Configura una URL de staging antes de probarlo desde un teléfono.</p>}
      <div className="form-actions qr-actions">
        <button className="button button-primary" onClick={downloadSvg} type="button">Descargar SVG</button>
        <button className="button button-secondary" onClick={copyUrl} type="button">Copiar enlace</button>
        <button className="button button-secondary" onClick={() => window.print()} type="button">Imprimir prueba</button>
      </div>
      {copyMessage && <p className="form-message" role="status">{copyMessage}</p>}
      <small>No imprimas este QR en volumen. El QR definitivo requiere dominio estable y aprobación del piloto.</small>
    </section>
  );
}
