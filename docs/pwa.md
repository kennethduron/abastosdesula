# Progressive Web App

La demo es instalable en navegadores compatibles mediante el manifest nativo de
Next.js y un service worker pequeño, sin librerías PWA adicionales.

## Recursos

- `/manifest.webmanifest`: nombre, idioma, alcance, colores, shortcut e iconos.
- `/icons/icon-192.png` y `/icons/icon-512.png`: iconos de instalación.
- `/icons/maskable-512.png`: variante segura para máscaras de Android.
- `/icons/apple-touch-icon.png`: icono de pantalla de inicio en iOS/iPadOS.
- `/sw.js`: cache público versionado.
- `/offline.html`: fallback informativo sin datos privados.

Los iconos derivan de la hoja y la paleta navy/verde del sistema visual existente.

## Política de cache

El service worker solo intercepta `GET` del mismo origen.

Se permite cachear:

- Home y navegación pública de comerciantes con estrategia network-first;
- chunks inmutables de `/_next/static/` e iconos con cache-first;
- fotografías públicas con stale-while-revalidate;
- manifest y fallback offline.

Nunca se interceptan ni cachean:

- `/api/*`;
- `/panel`;
- `/admin`;
- `/acceso`;
- `/_next/data/*`;
- requests externas de Firebase;
- métodos distintos de `GET`.

Una respuesta con `private` o `no-store` tampoco se guarda. Esto evita que una
sesión o dato de un merchant reaparezca offline para otro usuario.

## Actualizaciones

`sw.js` se sirve con `no-cache, no-store`, scope explícito y CSP propia. Al
cambiar de forma incompatible los recursos precacheados, incrementa
`CACHE_VERSION`; la activación elimina versiones anteriores con prefijo
`abastos-public`.

## Compatibilidad

- Chrome/Edge en Android y desktop pueden ofrecer instalación según sus propias
  reglas de engagement.
- En iOS/iPadOS se utiliza “Agregar a pantalla de inicio”; no se promete un prompt
  automático ni comportamiento nativo fuera de las capacidades del sistema.
- La aplicación sigue funcionando como web normal si Service Worker no existe o
  falla su registro.

## QA

`e2e/pwa.spec.ts` valida manifest, dimensiones de iconos, metadata, headers,
registro/control del worker, ausencia de rutas privadas en Cache Storage, Home
offline y fallback offline para una ruta pública no precargada.
