# Producción en Vercel

## Proyecto activo

- Team/scope: `ken-code` (`Ken Code`).
- Proyecto: `abastosdesula`.
- Dominio: `https://abastosdesula.vercel.app`.
- Rama de producción: `main`.
- Runtime: Node.js `22.x`.

Vinculación local segura:

```bash
vercel link --yes --project abastosdesula --scope ken-code
```

`.vercel/` y los archivos `.env*` permanecen ignorados por Git.

## Variables de Production

La aplicación requiere las seis variables `NEXT_PUBLIC_FIREBASE_*` y las tres
variables Firebase Admin documentadas en `firebase-demo-setup.md`. El seed y el
E2E autenticado usan además siete variables `DEMO_*`. Todas deben tener valor,
estar asignadas a Production y cargarse antes de crear el deployment.

La etapa comercial puede habilitar `PRESENTATION_AUTO_ACCESS=true` únicamente
como variable privada de Production. Su política de aprovisionamiento y el
procedimiento de desactivación están documentados en
[`presentation-auto-access.md`](presentation-auto-access.md).

No pegues secretos en argumentos de comandos, commits, tickets o logs. Las
variables sensibles de Vercel no siempre pueden descargarse; valida su formato
dentro de un runtime protegido y reporta solo estados.

## Incidente Firebase Admin resuelto

El 503 no era causado por la service account. `firebase-admin/auth` cargaba
`jwks-rsa@4.1.0`, cuyo CommonJS hacía `require()` de `jose@6` ESM dentro del
loader serverless de Turbopack. El import fallaba antes de inicializar
credenciales.

`pnpm-workspace.yaml` fija únicamente la dependencia transitiva incompatible:

```yaml
overrides:
  "jwks-rsa>jose": 4.15.9
```

Las rutas que usan `firebase-admin` declaran runtime Node.js. El endpoint de
sesión registra diagnósticos sanitizados por etapa y nunca incluye claves,
tokens, cookies o emails completos.

## Deploy

Después de QA y push de `main`:

```bash
vercel deploy --prod --scope ken-code
vercel inspect <deployment> --scope ken-code
```

Confirma que el deployment esté `READY`, use el commit esperado y que el alias
apunte al nuevo deployment. `READY` no sustituye la prueba de la URL real.

## Auditoría posterior

- GET público: `/`, directorios, perfiles, productos, promociones, noticias y
  contacto deben responder 200.
- Anónimo: `/panel` y `/admin` deben redirigir 307 a `/acceso`.
- `/api/auth/session` sin cookie debe responder 401.
- Un token sintético inválido debe responder 401, nunca 500/503.
- Merchant y admin deben entrar solo al panel correspondiente.
- Ejecutar el E2E Firebase real y la suite pública contra el dominio final.
- Revisar logs Vercel por 5xx, errores no controlados y datos sensibles.
- Verificar manifest, service worker, offline fallback y ausencia de rutas
  privadas en cache.
- Confirmar cero overflow en 375×812, 390×844, 430×932, 768×1024, 1024×768,
  1280×800, 1440×900 y 1920×1080.

Los screenshots finales se guardan en `artifacts/final-production-audit/`, una
ruta ignorada por Git.
