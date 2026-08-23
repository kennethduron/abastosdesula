# Arquitectura de la demo

## Objetivo

Central de Abastos de Sula se mantiene como un monolito modular en Next.js. Las
rutas y componentes consumen contratos del dominio o adaptadores acotados, no
credenciales ni SDKs administrativos. Esto permite usar Firebase durante la demo
y migrar después a Supabase/PostgreSQL sin reconstruir la interfaz.

## Capas

```text
src/app y src/components
        -> servicios/casos de uso
        -> src/data/repositories (contratos)
        -> src/data/adapters/mock | browser | firebase
        -> futuro: adapter supabase
        -> src/domain (reglas y modelos)
```

- `src/domain`: entidades, schemas Zod y reglas sin React, Next.js o Firebase.
- `src/data/repositories`: contratos de persistencia y consultas.
- `src/data/adapters/mock`: datos reproducibles para render y pruebas.
- `src/data/adapters/browser`: persistencia local del flujo demo sin backend.
- `src/data/adapters/firebase`: inicialización lazy de SDK cliente/Admin, sesión,
  suscripciones privadas y escritura pública validada en servidor.
- `src/app`: Server Components por defecto; Client Components solo donde hay
  formularios, filtros, carrito o sincronización real.

## Modos de ejecución

Sin variables Firebase, `/panel` y `/admin` conservan puertas locales marcadas
explícitamente como demostrativas. No se consideran una frontera de seguridad.

Cuando Firebase Admin está configurado, ambas rutas exigen una cookie de sesión
verificada. El `businessId` del comerciante procede de custom claims y no de un
selector o payload del usuario. `/admin` requiere `institutional_admin` y consume
solo actividades agregadas, sin contactos, notas o detalle financiero.

## Flujo público persistente

```text
formulario público
  -> POST /api/quote-requests
  -> Zod strict
  -> límite básico por IP
  -> Firebase Admin SDK
  -> batch: customer + quote + activity + notification
```

La escritura pública directa a Firestore está denegada. El cliente nunca recibe
credenciales Admin. La cookie `abastos_session` es `HttpOnly`, `SameSite=Lax`,
segura en producción y dura como máximo cinco días. Cada acceso comprueba que
`users/{uid}` continúa activo y conserva el rol del token.

El intercambio de token exige origen y protocolo coincidentes, y rechaza tokens
cuya autenticación tenga más de cinco minutos. Esto sigue la recomendación de
Firebase para reducir CSRF y el riesgo de reutilizar un ID token robado.

## Fronteras multitenant

Toda entidad privada tiene `businessId`. Firestore Rules exige rol activo y que
el claim coincida con el documento. Un comerciante solo puede cambiar `status`,
`history` y `updatedAt` de sus solicitudes; no puede modificar cliente, items ni
tenant. El administrador institucional no puede leer `quoteRequests` ni
`customers`.

El rate limit actual es in-memory y apropiado solo para esta demo. Una plataforma
contractual deberá adoptar un almacén distribuido, App Check/CAPTCHA y
observabilidad antes de aceptar tráfico sostenido.

## Carrito

Un carrito tiene un único `businessId`. `addItemToCart` devuelve
`business_conflict` al intentar mezclar comercios para que la UI ofrezca cancelar
o reemplazar el carrito sin perder datos silenciosamente.

## Evolución

1. `MockRepository` y adapter browser: UI y flujo funcional sin infraestructura.
2. `FirebaseAdapter`: backend temporal con Auth, Firestore y Rules multitenant.
3. `SupabaseRepository`: implementación futura sobre PostgreSQL, membresías y RLS.

Los adaptadores futuros deben conservar contratos, schemas y pruebas de
aislamiento. No se deben trasladar reglas de negocio a componentes React.
