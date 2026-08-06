# ADR-0001 — QR SVG generado en la interfaz

## Decisión

Usar `qrcode.react` para representar el enlace configurado como SVG dentro de la pantalla administrativa.

## Motivo

El SVG es nítido al imprimir, no requiere un servicio externo que conozca la URL y evita almacenar un archivo desactualizado cuando cambie el entorno. La dependencia se carga únicamente en la herramienta administrativa del QR, no en el formulario público.

## Límites

El QR de la Etapa 3 está marcado como prueba. No se considera definitivo hasta contar con dominio estable y completar el piloto.
