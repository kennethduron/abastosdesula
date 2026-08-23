# Progreso de la demo

## Fase actual

Perfil, catálogo y carrito completados; siguiente fase: solicitud de cotización.

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

## Decisiones

- Monolito modular.
- Server Components por defecto.
- UI desacoplada de Firebase/Supabase.
- Datos demo marcados explícitamente.
- `businessId` obligatorio para aislamiento privado.
- Precios expresados en unidades menores.

## Problemas conocidos

- Firebase, autenticación y persistencia real todavía no están conectados.
- El carrito todavía no incluye el formulario estructurado de solicitud.

## Siguiente fase

Integrar `feat/merchant-profile-cart` y construir el formulario de solicitud mock con React Hook Form, Zod y confirmación persistente.
