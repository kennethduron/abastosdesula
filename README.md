# Central de Abastos de Sula

Base técnica de la demo web multicomercio de Central de Abastos de Sula.

## Requisitos

- Node.js 22 o una versión LTS compatible
- pnpm 11

## Desarrollo local

```bash
pnpm install
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## Validaciones

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Variables de entorno

Copia `.env.example` como `.env.local` cuando sea necesario. No se deben versionar credenciales ni valores reales.

## Alcance actual

Este repositorio contiene únicamente la base de Next.js, el sistema de estilos y las herramientas de calidad. La interfaz pública, autenticación, persistencia, integraciones y lógica multitenant se implementarán en fases posteriores.
