# Preparación de producción en Vercel

## Estado actual

- Cuenta CLI autenticada: `kennethduronpaz-7247`.
- Team detectado: `kennethduronpaz-7247s-projects`.
- Proyecto `abastosdesula`: todavía no existe.
- `https://abastosdesula.vercel.app`: responde `DEPLOYMENT_NOT_FOUND`.
- Runtime fijado a Node.js `22.x` en `package.json` para coincidir con desarrollo
  y evitar adoptar silenciosamente el default `24.x` de un proyecto nuevo.

No se debe crear ni desplegar el proyecto final hasta disponer del proyecto
Firebase y sus variables seguras.

## Variables requeridas

### Públicas, incluidas en el bundle

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

`NEXT_PUBLIC_USE_FIREBASE_EMULATORS` debe omitirse o ser `false` en Vercel.

### Secretos exclusivos del servidor

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Nunca configures claves Admin con prefijo `NEXT_PUBLIC_`. Las contraseñas de las
cuentas demo no son variables necesarias para ejecutar la aplicación en Vercel;
se utilizan únicamente al ejecutar el seed desde un entorno autorizado.

## Preparación de Firebase previa

1. Crear el proyecto Firebase dedicado.
2. Habilitar Email/Password y Firestore.
3. Desplegar Rules e índices desde una sesión Firebase CLI autorizada.
4. Ejecutar el seed controlado fuera de Vercel.
5. Añadir `abastosdesula.vercel.app` a dominios autorizados de Firebase Auth.
6. Verificar Merchant A, Merchant B y administrador antes del deploy público.

## Creación y deploy

Ejecutar únicamente cuando las variables anteriores estén disponibles:

```bash
vercel link --yes --project abastosdesula
vercel env add <VARIABLE> production
vercel env add <VARIABLE> preview
vercel deploy --prod
```

No pegues secretos en comandos que queden en historial. Usa la entrada segura de
la CLI o el dashboard. Preview debería usar un proyecto Firebase separado; si no
existe, limita inicialmente las variables a Production.

## Auditoría posterior

```bash
PLAYWRIGHT_BASE_URL=https://abastosdesula.vercel.app pnpm test:e2e
```

Además de Playwright, verificar:

- status/headers de `/`, `/manifest.webmanifest`, `/sw.js` y los cuatro iconos;
- instalación PWA en Chrome/Edge y “Agregar a pantalla de inicio” en iOS;
- login/logout y redirecciones por rol;
- solicitud pública, persistencia y cambio de estado tras refresh;
- aislamiento Merchant A/B y privacidad del administrador institucional;
- logs Vercel sin secretos, errores, hydration mismatch o imágenes fallidas;
- cero overflow en los ocho viewports definidos;
- cache PWA sin `/api`, `/panel`, `/admin` o `/acceso`.

Si el deploy falla, no cambies producción a mano. Corrige en una rama, repite QA
y despliega un nuevo build; Vercel conserva el deployment anterior para rollback.
