# Configuración de Firebase para la demo

Firebase es un backend temporal. Vercel continúa siendo el hosting del frontend;
no se utiliza Firebase Hosting.

## Proyecto y servicios

1. Crear o seleccionar un proyecto Firebase dedicado a esta demo.
2. Habilitar Authentication con Email/Password.
3. Crear Cloud Firestore en la región aprobada para la demostración.
4. Registrar una Web App y copiar sus identificadores públicos.
5. Crear una service account de alcance mínimo para Vercel.

No descargues ni copies un JSON de service account dentro del repositorio.

## Variables

Copia `.env.example` a `.env.local` y completa:

- `NEXT_PUBLIC_FIREBASE_*`: identificadores públicos de la Web App.
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`:
  credenciales exclusivas del servidor.
- `DEMO_MERCHANT_*`, `DEMO_MERCHANT_B_*` y `DEMO_ADMIN_*`: credenciales
  temporales del seed. El segundo merchant existe únicamente para probar
  aislamiento entre tenants.
- `DEMO_SEED_CONFIRM=abastosdesula-demo`: confirmación explícita del seed.

En `FIREBASE_PRIVATE_KEY`, conserva saltos como `\n` si la variable está en una
sola línea. Nunca uses `NEXT_PUBLIC_` para credenciales Admin o contraseñas.

## Reglas y emulador

Con Java 21 instalado:

```bash
pnpm test:firebase-rules
```

La suite verifica anonimato, aislamiento Merchant A/B, cambios manuales de
`businessId`, campos permitidos del workflow, privacidad institucional y
notificaciones por tenant.

Con autenticación CLI válida, despliega solo reglas e índices:

```bash
pnpm exec firebase deploy --only firestore:rules,firestore:indexes
```

Verifica el proyecto activo antes de desplegar. `demo-abastosdesula` se reserva
para emuladores y no representa un proyecto remoto.

## Seed controlado

```bash
pnpm firebase:seed
```

El seed prepara dos merchants y un administrador con custom claims; fusiona seis
comercios, cinco categorías, seis perfiles y doce productos; y crea dos clientes,
solicitudes, actividades y notificaciones conocidas solo si no existen. Nunca
borra colecciones, recorre datos desconocidos ni imprime credenciales. Repetirlo
preserva solicitudes y estados existentes.

## Activación y QA

1. Iniciar `pnpm dev` con variables configuradas.
2. Abrir `/acceso` y probar ambos roles.
3. Confirmar que merchant entra a `/panel` y admin a `/admin`.
4. Enviar una solicitud pública y verla en el CRM.
5. Cambiar estado, refrescar y comprobar persistencia.
6. Repetir acceso cruzado y revisar logs sin exponer payloads privados.

Sin configuración, `/acceso` informa que se usa el fallback local de QA. Ese
modo no debe presentarse como autenticación real.
