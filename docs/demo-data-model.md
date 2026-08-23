# Modelo de datos de la demo

Todos los registros actuales son demostrativos y contienen `isDemo: true`.

## Entidades públicas

- `Business`: identidad legal/técnica del tenant demo.
- `Merchant`: perfil público, categorías, imagen y productos destacados.
- `Category`: clasificación navegable del catálogo.
- `Product`: siempre pertenece a un `businessId` y una categoría.
- `Promotion`: promoción demostrativa asociada a un negocio y productos.

## Entidades privadas por negocio

- `Customer`: contacto visto únicamente por el negocio correspondiente.
- `QuoteRequest`: solicitud/cotización con estado e historial.
- `QuoteRequestItem`: snapshot del producto, cantidad y unidad solicitada.
- `Notification`: aviso dirigido a un negocio y opcionalmente a un usuario.
- `Activity`: auditoría de acciones agregadas o por negocio.
- `MerchantUser`: vínculo explícito entre usuario y negocio.

## Identidad

- `User`: usuario autenticado con rol `merchant` o `institutional_admin`.
- `MerchantUser`: membresía y permisos operativos dentro de un solo negocio.

## Carrito

- `Cart.businessId`: negocio dueño de todos los items.
- `CartItem.businessId`: redundancia intencional para validar consistencia.
- Mezclar negocios produce un conflicto explícito y nunca una sustitución silenciosa.

## Estados de solicitud

```text
new -> in_review -> quoted -> confirmed -> preparing -> completed
  `-----------------------------------------------------> cancelled
```

Cada cambio crea un `QuoteStatusEvent` con fecha, estado y actor opcional.

## Dinero

Los importes se almacenan en unidades menores (`amountMinor`) y moneda `HNL`. Los precios actuales son referencias ficticias de la demo, no ofertas comerciales reales.

## Preparación PostgreSQL

Los identificadores son strings opacos para permitir UUIDs futuros. `businessId` se convertirá en clave foránea y política RLS. Las consultas paginadas ya forman parte del contrato de productos para evitar cargar catálogos completos.
