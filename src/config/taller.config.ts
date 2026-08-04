export const tallerConfig = {
  identidad: {
    nombreComercial: "Taller Demo",
    razonSocial: "Taller Demo SpA",
    rut: "76.123.456-7",
    giro: "Servicios metalmecánicos",
    logoPath: "/branding/logo.png",
    logoAlt: "Logo de Taller Demo",
    colorAcento: "#1f3a5f",
  },
  contacto: {
    direccion: "Dirección de ejemplo 123",
    comuna: "Santiago",
    region: "Región Metropolitana",
    telefono: "+56 9 0000 0000",
    correo: "contacto@tallerdemo.cl",
    sitioWeb: "",
  },
  cotizacion: {
    moneda: "CLP",
    preciosSonNetos: true,
    tasaIvaPredeterminada: 19,
    vigenciaDias: 30,
    descuentoPredeterminado: 0,
    anticipoPredeterminado: 0,
    formasPago: ["Efectivo", "Transferencia", "Tarjeta"],
    condicionesPago: "Pago al retirar o recibir el trabajo, salvo acuerdo previo",
    materialesPredeterminado: "",
    textoAgradecimiento: "Gracias por confiar en nuestro trabajo.",
    leyendaComercial: "Esta cotización es una propuesta comercial y no reemplaza una boleta o factura.",
  },
  ordenTrabajo: {
    recepcionPredeterminada: "hoy",
    entregaObligatoria: false,
    etiquetaSinEntrega: "Sin fecha comprometida",
    cantidadesSoloEnteras: true,
    reglaVariasPiezas: "Agrupar solo cuando comparten trabajo, estado y entrega; separar cuando tienen entregas independientes.",
  },
  sistema: {
    idioma: "es-CL",
    zonaHoraria: "America/Santiago",
    fechaDemo: "2026-08-04",
  },
} as const;

export type TallerConfig = typeof tallerConfig;
