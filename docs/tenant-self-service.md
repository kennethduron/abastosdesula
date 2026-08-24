# Autogestión de inquilinos y estados de cuenta

## Alcance

Esta fase incorpora una experiencia de consulta para cobros institucionales. No procesa pagos, no realiza conciliaciones bancarias y no sustituye un sistema contable o de facturación fiscal.

El comerciante consulta su estado de cuenta desde el panel. La administración institucional consulta agregados y próximos vencimientos desde la sección **Inquilinos**. La cuenta de presentación utiliza el rol `presentation_viewer`, que comparte únicamente las lecturas institucionales autorizadas y no recibe permisos de escritura.

## Modelo de datos

La información se divide en dos colecciones de Firestore:

- `tenantAccounts/{businessId}`: resumen vigente por negocio. Incluye `businessId`, datos del responsable y local, estado contractual, siguiente vencimiento, mensualidad referencial, saldo y estado de cuenta.
- `tenantPayments/{paymentId}`: historial por período. Incluye `businessId`, período, vencimiento, concepto, monto, monto pagado, estado, fecha de pago y referencia.

Todos los documentos privados contienen `businessId`. El identificador del documento de cuenta coincide con el negocio para ofrecer una lectura directa y reducir el riesgo de consultas ambiguas.

Los importes se guardan en centavos de lempira (`amountMinor`) para evitar errores de punto flotante. Las fechas admiten `Timestamp` de Firestore o ISO durante la transición de datos controlados.

## Autorización y privacidad

Las reglas aplican estas capacidades:

| Rol                          | Su cuenta | Otras cuentas      | Agregados institucionales | Escritura de cobros | CRM privado                 |
| ---------------------------- | --------- | ------------------ | ------------------------- | ------------------- | --------------------------- |
| Comerciante                  | Sí        | No                 | No                        | No                  | Solo su negocio             |
| Presentación                 | No aplica | Lectura autorizada | Sí                        | No                  | No                          |
| Administración institucional | No aplica | Lectura autorizada | Sí                        | No en esta fase     | Sin detalle privado del CRM |

La interfaz también oculta controles administrativos a la cuenta de presentación, pero la protección decisiva está en Firestore y en la validación de sesión del servidor. Las reglas se prueban con dos comerciantes distintos, administración y presentación.

## Preparación para pago en línea

El portal muestra la disponibilidad futura de **Pago en línea**, sin crear cobros ni invocar una pasarela. Una futura fase podrá incorporar un servicio de pagos detrás de una API de servidor con:

1. creación idempotente de intención de pago;
2. validación del importe contra el estado de cuenta del servidor;
3. confirmación firmada mediante webhook;
4. registro inmutable del comprobante;
5. actualización transaccional del saldo;
6. auditoría y conciliación.

El botón actual está deshabilitado deliberadamente y no contiene claves, enlaces de pago ni lógica financiera.

## Puntos de extensión para automatización

Los campos `nextDueDate`, `status`, `paidAt` y `reference` permiten añadir posteriormente tareas programadas que detecten:

- vencimiento próximo;
- vencimiento alcanzado sin pago;
- confirmación de pago;
- emisión de comprobante.

Esas tareas deberán ser idempotentes, registrar el evento procesado y respetar preferencias de comunicación. Esta fase no envía correo, WhatsApp, SMS ni notificaciones externas.

## Datos controlados y provisión

`pnpm firebase:provision-tenant-service` crea o actualiza únicamente la cuenta de presentación y los documentos controlados definidos para los seis negocios existentes. El proceso:

- exige confirmación explícita del proyecto;
- se detiene si encuentra un documento objetivo que no sea controlado;
- usa escrituras con `merge`;
- no elimina colecciones ni documentos;
- nunca imprime la contraseña.

Las credenciales se proporcionan mediante variables locales ignoradas por Git. No deben copiarse a documentación, capturas, incidencias o logs.

## Límites actuales

- No hay procesamiento real de dinero.
- No hay edición institucional de saldos desde la UI.
- No hay contabilidad, bancos, impuestos, conciliación ni factura fiscal.
- No hay recordatorios automáticos ni comprobantes emitidos.
- Los movimientos iniciales son datos controlados, coherentes con los comercios existentes, para validar producto, aislamiento y responsive.
