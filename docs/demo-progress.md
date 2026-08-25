# Progreso de la demo

## Portal de autogestión del comerciante

La rama `feat/merchant-self-service` incorpora registro público con aprobación,
creación de acceso por la Central, contraseña temporal obligatoria, recuperación
de acceso, Mi negocio, productos, publicación real al catálogo, inventario
transaccional, métricas operativas y preparación de documentos comerciales.

El rol `merchant_applicant` evita que el registro público reciba acceso de
presentación o privilegios antes de la aprobación. Las Rules incluyen pruebas
negativas entre aspirante, Merchant A, Merchant B, visor y administración.

El catálogo público usa una proyección Firebase aditiva que conserva los datos
existentes. Una solicitud generada con un producto nuevo se valida contra el
documento publicado y entra al mismo CRM, sin descontar inventario.

Firebase Storage queda detrás de un adaptador y reglas preparadas. Su activación
espera verificación explícita del bucket y facturación; no se habilitaron
servicios pagos. Pagos en línea y facturación fiscal siguen fuera del alcance.

## Estado de producción

La demo está operativa en `https://abastosdesula.vercel.app` sobre el proyecto
Vercel `ken-code/abastosdesula` y Firebase `abastosdesula-demo`.

- Firebase Admin funciona en Node.js serverless.
- Firebase Authentication usa Email/Password y sesiones HttpOnly verificadas.
- Firestore `(default)` está en modo Native, con reglas e índices desplegados.
- El seed remoto se ejecutó de forma controlada y no destructiva.
- `/panel` y `/admin` redirigen a `/acceso` sin sesión; no devuelven 5xx.
- La PWA excluye del cache las rutas privadas, autenticación y API.

## Datos y usuarios demo

El entorno contiene seis comercios, cinco categorías, seis perfiles públicos,
doce productos públicos, fixtures privados y datos de auditoría marcados con
`isDemo`. Existen tres usuarios Firebase Auth, sin credenciales en Git:

- Merchant A: `role=merchant`, `businessId=business-frutas-valle`, `active=true`.
- Merchant B: `role=merchant`, `businessId=business-la-huerta`, `active=true`.
- Admin institucional: `role=institutional_admin`, `active=true`.

Las credenciales se conservan únicamente en variables sensibles de Vercel y en
un archivo local ignorado por Git. Este documento nunca incluye contraseñas.

## Flujo validado

1. Un comprador abre el directorio, un perfil y agrega un producto al carrito.
2. Envía datos ficticios y la API crea cliente, solicitud, actividad y
   notificación en Firestore.
3. Merchant A inicia sesión, ve solo su negocio y su CRM.
4. Cambia una solicitud de Nueva a En revisión y después a Cotizada.
5. El estado persiste después de recargar.
6. Merchant B no puede leer la solicitud, cliente o producto privado de A, ni
   cambiar de tenant manipulando la URL.
7. Merchant A tampoco puede leer solicitudes de B.
8. El admin ve únicamente resumen institucional y actividad permitida; no ve
   solicitudes o clientes privados completos.

## Límites del demo

- Los productos, precios, teléfonos y solicitudes son ficticios.
- No se envían mensajes, pagos ni operaciones comerciales reales.
- El rate limit de solicitudes públicas es local a cada instancia serverless;
  debe sustituirse por un almacén distribuido antes de uso contractual.
- Firebase es el backend temporal de esta demostración.

## Migración futura

La arquitectura mantiene contratos de repositorio independientes del proveedor.
Una fase posterior puede migrar identidad y datos relacionales a
Supabase/PostgreSQL, preservando `businessId` como clave de aislamiento,
aplicando RLS equivalente y moviendo historial, cotizaciones y clientes a tablas
normalizadas. La migración debe incluir reconciliación de usuarios, auditoría de
roles y pruebas negativas equivalentes a las actuales Rules de Firestore.
