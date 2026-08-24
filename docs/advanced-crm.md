# CRM comercial avanzado

## Flujo preservado

El carrito vive exclusivamente en el navegador. Agregar, quitar o cambiar la
cantidad de un producto no escribe en Firestore. La escritura comienza cuando
el comprador confirma `Enviar solicitud`:

1. `POST /api/quote-requests` valida origen, límite de uso y payload con Zod.
2. Firebase Admin valida que comercio y productos coincidan.
3. Un batch crea cliente, solicitud, actividad agregada y notificación.
4. La solicitud queda con `source=platform` y `status=new`.
5. El listener del comerciante consulta únicamente su `businessId`.

## Agregado privado de solicitud

`quoteRequests/{quoteId}` conserva los campos existentes y admite campos
opcionales compatibles:

- `company`, `source` y datos comerciales del contacto.
- `items[]` con precio de referencia e imagen de catálogo.
- `quotation` con líneas, descuento, total, versión y fecha.
- `internalNotes[]` privadas.
- `followUps[]` con vencimiento y estado.
- `activity[]` como timeline privado.
- `history[]` como historial de estados.

Los documentos anteriores siguen siendo legibles; el adaptador aplica valores
seguros a campos ausentes. No se requiere migración ni recreación de datos.

## Clientes

`customers/{customerId}` mantiene `businessId` y agrega opcionalmente empresa y
notas internas. El módulo calcula solicitudes, completadas, productos
consultados y última interacción a partir de solicitudes reales del mismo
comercio.

## Seguridad

- Las Rules obtienen el comercio desde el custom claim autenticado.
- Un comerciante solo puede crear solicitudes manuales para su propio
  `businessId`.
- En solicitudes existentes solo puede cambiar campos de workflow comercial;
  identidad, cliente, productos y comercio quedan inmutables.
- En clientes solo puede agregar notas privadas y actualizar la fecha.
- El administrador institucional conserva acceso a actividad agregada, nunca a
  solicitudes, clientes, cotizaciones o notas privadas.
- Las notificaciones solo permiten marcar `readAt` dentro del comercio dueño.

## Interfaz

- Resumen con métricas derivadas de solicitudes, clientes y productos reales.
- CRM con lista, pipeline, búsqueda, filtros y ordenamiento.
- Drawer de solicitud con contacto, productos, cotización, notas, seguimientos
  y timeline.
- Clientes con historial y notas privadas.
- Solicitud manual validada con Zod.
- WhatsApp abre un enlace seguro con mensaje prellenado; nunca envía mensajes.
