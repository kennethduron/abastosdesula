# Progreso de la demo

## Fase actual

PWA completada; siguiente fase: preparación y auditoría de Vercel.

## Fases terminadas

### Home pública

- Rama: `feat/public-home`
- Commits principales:
  - `0bfa655 feat: build responsive public home`
  - `dd6aee7 feat: add premium motion and hero carousel`
  - `fc62c2e feat: move hero carousel to background`
- Integrada por fast-forward a `main`.
- QA: format, lint, typecheck, test, build y Playwright 15/15.

### Arquitectura de datos

- Rama: `feat/data-architecture`
- Commit: `fadb796 feat: add vendor-neutral data architecture`
- Modelos de dominio, contratos de repositorio y adaptador mock implementados.
- Regla de carrito monocomerciante y validación pública estricta incluidas.
- Integrada por fast-forward a `main`.

### Directorio de comerciantes

- Rama: `feat/merchant-directory`
- Ruta `/comerciantes` con búsqueda, categorías, disponibilidad y orden funcionales.
- Seis perfiles ficticios marcados como demo.
- Rutas de perfil prerenderizadas para evitar enlaces rotos.
- Matriz responsive y pruebas Playwright incluidas.

### Perfil, catálogo y carrito

- Rama: `feat/merchant-profile-cart`
- Perfiles prerenderizados con identidad, categorías e información demo.
- Catálogo con búsqueda, filtros, cantidades y precios ficticios de referencia.
- Carrito persistente mediante `localStorage` y sincronizado como store externo.
- Regla monocomerciante con conflicto explícito y opción segura para reemplazar.
- Drawer responsive y consulta opcional por WhatsApp demo.

### Solicitud de cotización

- Rama: `feat/quote-request-flow`
- Formulario validado con React Hook Form, Zod estricto y mensajes accesibles.
- Tipos de cliente, teléfono, WhatsApp opcional, modalidad y observaciones.
- Solicitud, historial inicial y actividad persistidos localmente para el CRM demo.
- Confirmación explícita sin envío de mensajes ni escrituras a servicios reales.

### Dashboard y CRM

- Rama: `feat/merchant-dashboard-crm`.
- Ruta estática `/panel` con puerta de acceso local explícitamente demo.
- Resumen, métricas, solicitudes, filtros, detalle, clientes e historial.
- Cambios de estado persistentes y aislamiento doble por `businessId`.
- Navegación responsive para teléfono, tablet y escritorio.
- QA: format, lint, typecheck, test, build y Playwright 48/48.

### Administración institucional

- Rama: `feat/institutional-admin`.
- Ruta `/admin` separada del CRM de comerciantes.
- Métricas agregadas, estados de comerciantes, actividad y contenido demo.
- Bloqueo explícito para sesiones merchant y acceso local diferenciado por rol.
- Sin nombres de clientes ni finanzas privadas detalladas en la vista central.
- Gestión local persistente de estado de negocios y visibilidad de categorías.
- Responsive: fichas móviles y tabla operativa desde tablet.
- QA dedicado: 5/5 escenarios Playwright, consola limpia y cero overflow.

### Backend Firebase demo

- Rama: `feat/firebase-demo-backend`.
- Firebase Authentication para merchant e institutional admin mediante sesión
  HttpOnly verificada en servidor.
- Endpoint público estricto con Zod, límite básico de abuso y escritura Admin
  atómica de cliente, solicitud, actividad y notificación.
- Suscripción Firestore del CRM limitada al `businessId` del claim.
- Panel institucional conectado solo a actividades agregadas seguras.
- Rules multitenant con pruebas en emulador para acceso anónimo, acceso cruzado,
  reasignación de tenant, manipulación del payload y privacidad institucional.
- Seed confirmado, idempotente y no destructivo para seis comercios y datos demo.
- QA: format, lint, typecheck, build, 10/10 unitarias, 6/6 Rules, 55/55
  Playwright estándar y 1/1 E2E Firebase con Auth/Firestore emulados.
- Bundle dividido: la Home no carga Firebase, `/acceso` carga solo Auth y
  Firestore queda limitado a los paneles privados.

### PWA instalable

- Rama: `feat/pwa`.
- Manifest nativo de Next.js, metadata Apple y theme color.
- Iconos 192, 512, maskable y Apple creados desde el símbolo visual del proyecto.
- Service worker sin dependencias con cache exclusivamente público y versionado.
- `/api`, autenticación, CRM y administración excluidos explícitamente del cache.
- Fallback offline institucional sin datos privados.
- QA: 5/5 escenarios PWA dedicados y regresión Playwright global 60/60; un
  escenario Firebase se ejecuta por separado y permanece excluido de la suite
  estándar.

## Decisiones

- Monolito modular.
- Server Components por defecto.
- UI desacoplada de Firebase/Supabase.
- Datos demo marcados explícitamente.
- `businessId` obligatorio para aislamiento privado.
- Precios expresados en unidades menores.
- El acceso local se conserva como fallback de QA cuando Firebase no está
  configurado; con configuración presente se sustituye por Auth y sesión real.

## Problemas conocidos

- No existen todavía credenciales ni proyecto Firebase remoto en el workspace.
  Por ello se validan Rules y arquitectura en emulador, pero no se ha activado ni
  sembrado un entorno remoto.
- El rate limit del endpoint público es in-memory y deberá reemplazarse por una
  solución distribuida antes de una operación contractual.

## Siguiente fase

Integrar `feat/pwa` y preparar Vercel sin desplegar hasta confirmar autenticación
y variables del proyecto. La activación remota de Firebase sigue pendiente de
credenciales seguras.
