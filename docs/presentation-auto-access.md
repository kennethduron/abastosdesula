# Acceso automático de presentación

## Propósito y activación

Durante la etapa comercial, una identidad creada manualmente en Firebase Authentication puede recibir acceso institucional de lectura sin un segundo paso operativo. La capacidad está desactivada por defecto y depende exclusivamente de la variable privada de servidor:

```text
PRESENTATION_AUTO_ACCESS=true
```

La variable se configura en el entorno de Production de Vercel. No utiliza el prefijo `NEXT_PUBLIC_`, no llega al navegador y no debe almacenarse con valores de producción en Git. Al cambiarla es necesario crear un nuevo deployment para que el runtime adopte el valor.

## Flujo seguro

1. Firebase Authentication valida correo y contraseña en el cliente.
2. `/api/auth/session` verifica el ID token y exige una autenticación reciente.
3. Si el token ya contiene un rol reconocido, se conserva el flujo existente.
4. Si no contiene un rol reconocido y la capacidad está habilitada, el servidor vuelve a consultar el usuario de Authentication y su perfil `users/{uid}`.
5. Una cuenta deshabilitada o un perfil con rol privilegiado incompatible se rechaza sin sobrescribirlo.
6. Una identidad elegible se sincroniza con `role: presentation_viewer` y `active: true`; el documento usa el UID real y nunca guarda contraseñas.
7. El servidor solicita al navegador renovar el ID token una sola vez. La sesión se crea únicamente cuando el claim renovado y el perfil activo coinciden.

El reintento único hace que el primer acceso sea transparente sin introducir bucles. Las escrituras de perfil y claims son reintentables: un fallo parcial no amplía permisos y puede completarse en el siguiente inicio de sesión.

## Comportamiento al desactivar

Con `PRESENTATION_AUTO_ACCESS` ausente, en `false` o con cualquier valor distinto de `true`, una identidad sin rol reconocido recibe una denegación controlada. Las sesiones existentes con `merchant`, `institutional_admin` o `presentation_viewer` continúan usando su validación normal.

## Capacidades del visor

`presentation_viewer` puede consultar el dashboard institucional, comerciantes, categorías, inquilinos, estados de pago, vencimientos y métricas agregadas. No puede escribir datos institucionales, administrar usuarios o roles, acceder al CRM privado, leer clientes o cotizaciones, cambiar configuración ni ejecutar acciones destructivas.

Firestore exige simultáneamente un claim reconocido, un perfil activo y coincidencia entre el rol del claim y el rol de `users/{uid}`. La interfaz oculta las acciones no disponibles, pero las reglas y la validación de sesión son la autoridad final.
