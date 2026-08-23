# Central de Abastos de Sula

Demo profesional multicomercio de Central de Abastos de Sula, desarrollada por
Ken Code. Incluye experiencia pública, carrito monocomerciante, solicitudes,
CRM de comerciantes y administración institucional.

## Requisitos

- Node.js 22 o una versión LTS compatible
- pnpm 11
- Java 21 (solo para las pruebas locales de Firestore Rules)

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
pnpm test:firebase-rules
pnpm test:e2e
pnpm build
```

## Variables de entorno

Copia `.env.example` como `.env.local` cuando sea necesario. No se deben
versionar credenciales ni valores reales. La aplicación conserva un modo local
demostrativo cuando Firebase no está configurado.

La configuración segura, el seed controlado y el uso de emuladores se describen
en [`docs/firebase-demo-setup.md`](docs/firebase-demo-setup.md).

## Alcance actual

Los datos y precios visibles son ficticios y se presentan únicamente como parte
de una demostración comercial. No hay pagos, facturación fiscal ni contabilidad
real. Consulta el avance y las decisiones en
[`docs/demo-progress.md`](docs/demo-progress.md).
