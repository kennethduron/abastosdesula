# Arquitectura de la demo

## Objetivo

Central de Abastos de Sula se mantiene como un monolito modular en Next.js. Las rutas y componentes consumen contratos del dominio, no SDKs de un proveedor de datos. Esto permite comenzar con memoria local, conectar Firebase para la demostración y migrar posteriormente a Supabase/PostgreSQL sin reconstruir la interfaz.

## Capas

```text
src/app y src/components
        ->
servicios/casos de uso
        ->
src/data/repositories (contratos)
        ->
src/data/adapters/mock
        -> futuro: firebase | supabase
        ->
src/domain (reglas y modelos)
```

- `src/domain`: entidades y reglas que no dependen de React, Next.js ni Firebase.
- `src/data/repositories`: contratos de persistencia y consultas.
- `src/data/adapters/mock`: implementación reproducible para desarrollo y QA.
- `src/data/adapters/browser`: persistencia local temporal para demostrar flujos entre comprador y CRM antes de Firebase.
- `src/data/repository-provider.ts`: punto de composición actual. Cambiar el proveedor no cambia la UI.
- `src/app`: Server Components por defecto. Los Client Components quedan limitados a búsqueda, filtros, carrito y otras interacciones reales.

## Fronteras de seguridad

Toda entidad privada utiliza `businessId`. Las lecturas y mutaciones sensibles requieren simultáneamente el identificador del negocio y el identificador de la entidad. El adaptador mock ya prueba que una solicitud de un negocio no puede consultarse usando otro `businessId`.

La futura entrada pública seguirá este recorrido:

```text
formulario público
  -> Server Action/Route Handler
  -> Zod strict
  -> control de abuso
  -> repositorio
  -> Firebase Admin
```

Los componentes cliente nunca recibirán credenciales administrativas.

## Carrito

Un carrito tiene un único `businessId`. `addItemToCart` devuelve un resultado explícito `business_conflict` si se intenta mezclar productos, permitiendo que la UI ofrezca cancelar o limpiar el carrito anterior sin perder datos silenciosamente.

## Estrategia de evolución

1. `MockRepository`: UI y flujos funcionales sin infraestructura externa.
2. `FirebaseRepository`: backend temporal de la demo con reglas multitenant.
3. `SupabaseRepository`: implementación futura sobre PostgreSQL y RLS.

Los tres adaptadores deberán satisfacer los mismos contratos y pruebas de aislamiento.
