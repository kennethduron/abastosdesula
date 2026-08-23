# Modelo de datos de la demo

Todos los registros actuales son demostrativos y contienen `isDemo: true`.

## Colecciones Firestore

```text
businesses/{businessId}      identidad pública del tenant
merchants/{merchantId}       perfil comercial público
categories/{categoryId}      taxonomía pública visible
products/{productId}         catálogo con businessId
users/{uid}                  rol y estado de acceso
customers/{customerId}       contacto privado por businessId
quoteRequests/{quoteId}      solicitud privada por businessId
activities/{activityId}      evento agregado seguro
notifications/{id}           aviso privado del comerciante
```

`users/{uid}` complementa los custom claims de Firebase Auth. La autorización
requiere que ambos coincidan, que `active` sea verdadero y, para merchants, que
el claim contenga un único `businessId`.

## Entidades públicas

- `Business`: identidad técnica del tenant demo.
- `Merchant`: perfil, categorías y productos destacados.
- `Category`: clasificación navegable del catálogo.
- `Product`: siempre pertenece a un negocio y categoría.
- `Promotion`: promoción ficticia asociada a un negocio.

## Entidades privadas

- `Customer`: contacto visible únicamente por su negocio.
- `QuoteRequest`: solicitud con items, estado e historial.
- `Notification`: aviso privado dirigido a un negocio.
- `Activity`: resumen de auditoría apto para vistas agregadas.
- `MerchantUser`: vínculo explícito entre usuario y negocio.

## Carrito y workflow

`Cart.businessId` es dueño de todos los items y cada `CartItem` repite ese valor
para validar consistencia. Mezclar negocios produce un conflicto explícito.

```text
new -> in_review -> quoted -> confirmed -> preparing -> completed
  `-----------------------------------------------------> cancelled
```

Cada cambio crea un evento con fecha, estado y actor opcional. En Firebase, las
Rules restringen el diff de una solicitud a `status`, `history` y `updatedAt`.
La creación pública usa un batch Admin atómico que genera cliente, solicitud,
actividad agregada y notificación. El administrador institucional consume la
actividad y nunca el documento privado.

## Dinero

Los importes usan unidades menores (`amountMinor`) y moneda `HNL`. Son referencias
ficticias de la demo, no ofertas comerciales ni transacciones reales.

## Preparación PostgreSQL

Los IDs son strings opacos para permitir UUIDs. `businessId` se convertirá en
clave foránea y política RLS. La migración debe traducir custom claims a
membresías, conservar la transacción del endpoint público y aplicar RLS a
clientes, solicitudes, notificaciones y actividad privada. Los contratos ya
contemplan paginación para no cargar catálogos completos.
