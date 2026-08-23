# Progreso de la demo

## Fase actual

Dashboard y CRM demo completados; siguiente fase: administración institucional.

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

## Decisiones

- Monolito modular.
- Server Components por defecto.
- UI desacoplada de Firebase/Supabase.
- Datos demo marcados explícitamente.
- `businessId` obligatorio para aislamiento privado.
- Precios expresados en unidades menores.
- El acceso del panel es una sesión local explícitamente demostrativa; no se
  considera una frontera de seguridad y será sustituida por autenticación real.

## Problemas conocidos

- Firebase, autenticación y persistencia real todavía no están conectados.
- La persistencia sigue siendo local; Firebase todavía no está conectado.

## Siguiente fase

Integrar `feat/merchant-dashboard-crm` y crear la administración institucional
antes de conectar Firebase.
