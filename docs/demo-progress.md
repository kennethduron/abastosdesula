# Progreso de la demo

## Fase actual

Arquitectura de datos desacoplada.

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
- Modelos de dominio, contratos de repositorio y adaptador mock implementados.
- Regla de carrito monocomerciante y validación pública estricta incluidas.

## Decisiones

- Monolito modular.
- Server Components por defecto.
- UI desacoplada de Firebase/Supabase.
- Datos demo marcados explícitamente.
- `businessId` obligatorio para aislamiento privado.
- Precios expresados en unidades menores.

## Problemas conocidos

- Firebase, autenticación y persistencia real todavía no están conectados.
- Los perfiles y solicitudes aún no están expuestos en rutas públicas.

## Siguiente fase

Crear `feat/merchant-directory` desde `main` actualizado e implementar `/comerciantes` con búsqueda y filtros funcionales.
