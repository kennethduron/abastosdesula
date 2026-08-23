# Progreso de la demo

## Fase actual

Directorio de comerciantes completado; siguiente fase: perfil, catálogo y carrito.

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

## Decisiones

- Monolito modular.
- Server Components por defecto.
- UI desacoplada de Firebase/Supabase.
- Datos demo marcados explícitamente.
- `businessId` obligatorio para aislamiento privado.
- Precios expresados en unidades menores.

## Problemas conocidos

- Firebase, autenticación y persistencia real todavía no están conectados.
- El catálogo de perfil todavía no incluye carrito ni formulario de solicitud.

## Siguiente fase

Integrar `feat/merchant-directory` y crear `feat/merchant-profile-cart` para completar catálogo, carrito monocomerciante y solicitud mock.
