# Portal de autogestión del comerciante

## Alcance

El portal completa el ciclo de incorporación, catálogo e inventario sin
convertir la plataforma en un ERP. Conserva el CRM, clientes, cotizaciones y
estado de cuenta existentes. No procesa pagos ni emite factura fiscal.

## Incorporación y aprobación

El acceso puede comenzar de dos formas:

1. `/registro-comerciante` envía una solicitud validada con React Hook Form y
   Zod a un endpoint de servidor con control de origen y límite por IP.
2. La Administración crea directamente una cuenta desde **Solicitudes de
   acceso → Crear acceso** y recibe una contraseña temporal que no se guarda ni
   se registra en logs.

El registro público crea primero una identidad con
`role=merchant_applicant`, perfil activo y solicitud `pending`. No crea un
negocio operativo. Este rol puede consultar únicamente su propia solicitud; no
puede abrir Administración, panel operativo, CRM, productos ni cuentas.

Un administrador institucional aprueba o rechaza. La aprobación es la única
operación que crea/asocia `business`, `merchant`, `user`, `businessId` y claims
de comerciante. El servidor genera el identificador del negocio; nunca toma un
`businessId` del navegador como autoridad.

Las cuentas creadas por la Central incluyen `mustChangePassword=true`. El primer
inicio redirige a `/cambiar-contrasena`; el servidor actualiza Firebase
Authentication, elimina el indicador del claim y obliga a iniciar sesión de
nuevo. `/acceso` también usa el mecanismo real de recuperación de Firebase y
muestra una confirmación que no revela si un correo existe.

## PRESENTATION_AUTO_ACCESS

El flujo se conserva para identidades creadas manualmente sin rol. Una cuenta
de registro público recibe el claim `merchant_applicant` antes de poder iniciar
sesión, por lo que la política de autoacceso la reconoce y jamás la convierte
en `presentation_viewer`. Hay una prueba unitaria explícita para esta frontera.

## Mi negocio y proyección pública

El comerciante puede editar nombre, descripción, categoría, teléfono,
WhatsApp, horario, local, logo, portada y publicación. Las Rules bloquean
`businessId`, slug, estado institucional, propietario, saldos y cualquier campo
administrativo.

La escritura sincroniza únicamente los campos publicables de `businesses` y
`merchants`. `getPublicCatalog` construye una proyección segura para el
directorio, `/comerciantes/[slug]`, `/productos` y `/productos/[slug]`. Solo
incluye campos comerciales aprobados; no mapea clientes, notas, cuentas,
pagos, usuarios ni identificadores administrativos visibles en la interfaz.

La proyección combina de forma aditiva los doce productos y seis comercios
existentes con nuevos documentos publicados. No migra, borra ni reescribe los
registros actuales.

## Productos e inventario

Los productos incluyen nombre, descripción, categoría, imagen, precio en
centavos de lempira, unidad, SKU, disponibilidad, existencia, mínimo, estado y
publicación. Un producto publicado y activo aparece inmediatamente en el perfil
del comerciante y en `/productos`; al ocultarlo deja de aparecer sin borrar su
historial.

`inventoryMovements` registra entrada, salida o ajuste, existencia previa y
nueva, motivo, fecha y usuario. Producto y movimiento se actualizan en una
transacción. Las Rules validan el dueño, comparan `previousStock` con el
producto antes de la transacción y `newStock` con `getAfter`. Nunca se acepta
stock negativo.

Estados derivados:

- existencia `0`: **Agotado** y el carrito deshabilita la cantidad;
- existencia mayor que `0` y menor o igual al mínimo: **Stock bajo**;
- el resto: **Disponible**.

Crear una solicitud o cotización no modifica inventario. El punto de descuento
queda reservado para una futura conversión confirmada a venta.

## Seguridad y aislamiento

Toda escritura privada mantiene `businessId`. Firestore exige simultáneamente
perfil activo, claim válido y coincidencia de negocio. Merchant A no puede leer
ni modificar el perfil, producto, inventario, CRM o cuenta de Merchant B.

`presentation_viewer` puede consultar solicitudes de acceso e información
institucional permitida, pero los endpoints de aprobar, rechazar, crear acceso y
cambiar estados exigen `institutional_admin`. El visor sigue sin acceso a CRM,
clientes o cotizaciones privadas.

Las pruebas de Rules cubren aspirante, dos comerciantes, administración,
presentación, creación de producto, manipulación de `businessId` e inventario
transaccional.

## Imágenes

Existe un contrato desacoplado `MerchantImageStorage` y un adaptador de Firebase
Storage con rutas por negocio, nombres aleatorios, tipos JPG/PNG/WebP y límite
de 5 MB. `firebase/storage.rules` valida ownership, tipo y tamaño.

El adaptador no se activa todavía en la UI porque el bucket y su modalidad de
facturación deben verificarse en el proyecto de producción. No se activó
facturación ni otro proveedor. Hasta esa decisión, el portal conserva imágenes
existentes y acepta URLs HTTPS; nunca almacena binarios en Firestore.

## Documentos y pagos futuros

**Documentos** explica la futura conversión de cotización a comprobante
comercial y la separa explícitamente de una factura fiscal oficial. No se
afirma cumplimiento tributario.

**Pago en línea** continúa deshabilitado. La extensión futura deberá crear una
intención idempotente en servidor, verificar monto, procesar un webhook firmado,
registrar comprobante y actualizar saldo transaccionalmente. No hay pasarela ni
movimiento de dinero en esta fase.

## Migración futura

Los contratos de dominio y almacenamiento mantienen la UI separada de Firebase.
Una migración a Supabase/PostgreSQL debe convertir claims en membresías, usar
RLS por `businessId`, conservar la proyección pública, importar movimientos de
inventario y repetir todas las pruebas negativas antes de cortar tráfico.
