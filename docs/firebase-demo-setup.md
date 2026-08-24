# Configuración de Firebase para la demo

Firebase es el backend temporal; Vercel aloja la aplicación. El proyecto remoto
autorizado es exclusivamente `abastosdesula-demo`.

## Servicios requeridos

- Firebase Authentication con Email/Password habilitado.
- Authorized Domain `abastosdesula.vercel.app`.
- Cloud Firestore `(default)` en modo Native.
- Reglas restrictivas e índices de `firebase/firestore.indexes.json` desplegados.
- Una Web App para la configuración pública.
- Una service account de mínimo privilegio para Firebase Admin.

No guardes un JSON de service account dentro del repositorio.

## Variables

Configuración pública de la Web App:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Configuración exclusiva del servidor:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Credenciales del entorno demo, nunca versionadas ni impresas:

```text
DEMO_MERCHANT_EMAIL
DEMO_MERCHANT_PASSWORD
DEMO_MERCHANT_B_EMAIL
DEMO_MERCHANT_B_PASSWORD
DEMO_ADMIN_EMAIL
DEMO_ADMIN_PASSWORD
DEMO_SEED_CONFIRM
```

`DEMO_SEED_CONFIRM` debe autorizar exactamente `abastosdesula-demo`. La clave
privada admite saltos reales o `\n` escapados; el adaptador normaliza estos
últimos antes de validarla criptográficamente. Nunca uses `NEXT_PUBLIC_` para
credenciales Admin o contraseñas.

## Auditoría segura

Con las variables cargadas en el proceso:

```bash
pnpm firebase:audit
```

La auditoría solo lee: valida el proyecto, coincidencia cliente/servidor,
formato del email, estructura criptográfica de la clave, conteos de colecciones,
usuarios esperados y custom claims. Su salida usa únicamente estados y conteos.

## Reglas e índices

```bash
pnpm test:firebase-rules
pnpm exec firebase deploy --only firestore:rules,firestore:indexes --project abastosdesula-demo
```

Las pruebas cubren anonimato, aislamiento Merchant A/B, cotizaciones, clientes,
productos privados, reasignación de tenant, campos de workflow, privacidad del
admin institucional y notificaciones.

## Seed controlado

Ejecuta el seed solo después de que `firebase:audit` confirme el proyecto y no
existan colisiones desconocidas:

```bash
pnpm firebase:seed
```

El seed exige el project ID exacto, no borra datos y usa IDs conocidos. Antes de
fusionar un documento existente exige `isDemo=true`; una colisión con datos no
demo aborta la operación. Crea o actualiza únicamente los tres usuarios demo,
sus claims y sus documentos asociados. Repetirlo conserva solicitudes y estados
ya existentes.

## QA de producción

La prueba Firebase real se habilita explícitamente y recibe credenciales por el
entorno, no por argumentos ni archivos versionados:

```bash
PLAYWRIGHT_BASE_URL=https://abastosdesula.vercel.app \
PLAYWRIGHT_FIREBASE_E2E=true pnpm playwright test e2e/firebase-live.spec.ts
```

Valida login, cotización, persistencia, transición de estado, aislamiento
multitenant, URL manipulada y restricciones institucionales.
