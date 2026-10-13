# SPEC 03 — Página "Acerca de" y envío de contacto con Resend

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-12
> **Objetivo:** Añadir la página `/acerca-de` fiel a `references/templates/home-about/about.jsx` y hacer que su formulario de contacto envíe un correo real con Resend mediante un Route Handler `POST /api/contact`.

## Por qué existe esta spec

La SPEC 02 dejó fuera la página "Acerca de", su enlace de nav y los estilos de about, contacto y terminal de éxito. En la plantilla el formulario solo simula el envío (`setSent(...)`). Esta spec porta la página tal cual y sustituye la simulación por un envío real, manteniendo la terminal de éxito como confirmación.

## Alcance

**Entra:**

- Nueva ruta `/acerca-de` (`app/acerca-de/page.tsx`) con las secciones de `about.jsx`:
  - **Hero**: kicker "▸ ACERCA DE", título "ACERCA DE ARCADE VAULT", párrafo de misión y 3 highlights con icono pixel (HEART, BROWSER, PLANT), textos copiados sin cambios.
  - **Divisor** decorativo con 24 píxeles animados (`aria-hidden`).
  - **Contacto**: kicker "▸ CONTACTO", título "CONTÁCTANOS", subtítulo, 3 tips con LED ("RESPUESTA EN 24-48H", "SUGERENCIAS BIENVENIDAS", "SIN SPAM, JAMÁS") y formulario NOMBRE / CORREO ELECTRÓNICO / MENSAJE con botón "▶ ENVIAR MENSAJE".
  - **Terminal de éxito** con el texto exacto de la plantilla, el nombre en mayúsculas y botón "ENVIAR OTRO MENSAJE" que limpia el formulario.
- Animación de aparición al scroll con el `Reveal` existente (`components/reveal.tsx`) y animación `shake` del formulario ante error de validación.
- Envío con **Resend** desde el Route Handler `POST /api/contact` (`app/api/contact/route.ts`). El formulario (client) hace `fetch` con JSON a ese endpoint; la API Key solo se lee en el servidor.
- Validación en el Route Handler (respuesta `400` con mensaje si es inválido): nombre 1–80 caracteres, correo con formato válido y máximo 254, mensaje 1–2000 caracteres (tras `trim`), más un campo **honeypot** oculto; si el honeypot trae valor, el endpoint responde `200` con éxito sin enviar.
- Estado de error visible en el formulario cuando falla la validación o el envío (sin perder lo escrito).
- Variables de entorno: `RESEND_API_KEY`, `CONTACT_TO_EMAIL` (destino) y `CONTACT_FROM_EMAIL` (remitente, por defecto `onboarding@resend.dev`). Archivo `.env.local` ya preparado con `RESEND_API_KEY` vacía (el usuario la completa después) y `.env.example` con los nombres sin valores.
- Correo enviado: asunto `[Arcade Vault] Mensaje de <nombre>`, `reply_to` = correo del visitante, cuerpo de texto plano con nombre, correo y mensaje.
- Nav: añadir el enlace **Acerca de** (`/acerca-de`) tras Salón de la Fama, en la barra y en el panel móvil, con estado `active` en `/acerca-de`.
- Portar a `app/globals.css` solo los bloques `ABOUT PAGE` de `references/templates/home-about/styles.css` (`.about*`, `.highlight*`, `.contact*`, `.tip*`, `.terminal-success`, `.shake`) y los estilos de `textarea` del formulario, evitando duplicar `.field`, que ya existe.
- Instalar la dependencia `resend`.

**Fuera de alcance:**

- Estilos y componente del gamepad (`.gp*`).
- Dominio propio verificado en Resend (se usa `onboarding@resend.dev`; ver Riesgos).
- Rate limit por IP, CAPTCHA o almacenamiento de mensajes.
- Correo de confirmación al visitante.
- Plantillas HTML/React Email para el correo.
- Pie de página o enlaces a "Acerca de" fuera del nav.
- Tests automatizados.

## Modelo de datos

No introduce estructuras persistentes. Contrato del endpoint `POST /api/contact` (JSON) y tipos locales en `app/api/contact/route.ts`:

```ts
// Petición
type ContactoPeticion = { nombre: string; correo: string; mensaje: string; sitio_web?: string };
// Respuesta: 200 { ok: true } | 400 { ok: false; error: string } | 500 { ok: false; error: string }
```

Campos del JSON: `nombre`, `correo`, `mensaje`, y el honeypot `sitio_web` (oculto, `tabIndex={-1}`, `autoComplete="off"`).

Variables de entorno (solo servidor, nunca `NEXT_PUBLIC_`):

```
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=onboarding@resend.dev
```

## Plan de implementación

1. Instalar `resend` (`npm install resend`) y crear `.env.example` (añadir excepción `!.env.example` en `.gitignore`, que hoy ignora `.env*`). `.env.local` ya existe con `RESEND_API_KEY` vacía. Verificar que `npm run build` sigue pasando.
2. Portar estilos: copiar a `app/globals.css` el bloque `ABOUT PAGE` de la plantilla y añadir estilos de `.field textarea` equivalentes a `.field input`. Omitir `GAMEPAD`. Revisar colisiones con `.kicker`.
3. Crear `components/highlight-icon.tsx` con los 3 iconos pixel (HEART, BROWSER, PLANT) y `components/about-divider.tsx` (opcional, puede ir en la página).
4. Crear `app/api/contact/route.ts` con `POST`: valida el JSON, aplica el honeypot, envía con `Resend` y responde `{ ok }`. Errores de Resend se registran en servidor y se devuelven con `500` y mensaje genérico. Si falta `RESEND_API_KEY`, responde `500` genérico sin romper el build. Probar con `curl` y, una vez puesta la clave, con un envío real.
5. Crear `components/contact-form.tsx` (client) con `useState`, `fetch("/api/contact")`, un único estado `status: "idle" | "sending" | "success" | "error"`, un mensaje de error visible dentro del formulario, estado `shake` ante error, terminal de éxito (`status === "success"`) y botón "ENVIAR OTRO MENSAJE". Botón deshabilitado mientras `status === "sending"`.
6. Crear `app/acerca-de/page.tsx` (Server Component) con hero, divisor y sección de contacto envuelta en `Reveal`. Añadir `metadata` con título.
7. Actualizar `components/nav.tsx`: enlace "Acerca de" en barra y panel móvil, activo en `/acerca-de`.
8. Ejecutar `npm run lint` y `npm run build`, y corregir errores.

Antes de escribir código específico de Next (Route Handlers, `metadata`), leer la guía relevante en `node_modules/next/dist/docs/`. Para el diseño de la interfaz usar `/frontend-design`, partiendo de la plantilla y respetándola exactamente.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] `/acerca-de` muestra el título "ACERCA DE ARCADE VAULT", el texto de misión y los 3 highlights de la plantilla.
- [ ] `/acerca-de` muestra "CONTÁCTANOS" con los 3 tips y los campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE.
- [ ] El nav muestra "Acerca de" en la barra y en el panel móvil, con clase `active` en `/acerca-de`.
- [ ] Enviar el formulario con un campo vacío no envía correo, muestra un mensaje de error y aplica la animación `shake`.
- [ ] Enviar con un correo de formato inválido muestra error y conserva lo escrito.
- [ ] Un envío válido entrega un correo al `CONTACT_TO_EMAIL` con asunto `[Arcade Vault] Mensaje de <nombre>` y `reply_to` igual al correo del visitante.
- [ ] Tras un envío válido se muestra la terminal con "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, <NOMBRE EN MAYÚSCULAS>."
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario con los campos vacíos.
- [ ] Si Resend falla, se muestra un mensaje de error genérico y el formulario conserva los valores.
- [ ] `POST /api/contact` con JSON inválido responde `400`; con el honeypot relleno responde `200` sin enviar correo.
- [ ] Con el honeypot relleno la UI muestra éxito y no se envía correo.
- [ ] El botón queda deshabilitado mientras el envío está pendiente.
- [ ] `RESEND_API_KEY` no aparece en el bundle del cliente ni en el repositorio (`git grep` sin coincidencias).
- [ ] `.env.example` existe y `.env.local` está ignorado por git.
- [ ] `app/globals.css` no contiene clases `.gp*`.
- [ ] A 375px de ancho no hay scroll horizontal en `/acerca-de`.
- [ ] Con `prefers-reduced-motion` las secciones aparecen sin animar.
- [ ] No hay errores de hidratación en la consola del navegador.

## Decisiones

- **Sí:** Route Handler `POST /api/contact` llamado con `fetch`. Decisión del usuario; separa claramente cliente y servidor y deja el endpoint reutilizable.
- **No:** Server Action. Descartada por el usuario en favor del endpoint explícito.
- **Sí:** ruta `/acerca-de`. Coherente con `/biblioteca` y `/salon`.
- **No:** `/about`. Rompe la convención en español de las rutas.
- **Sí:** remitente `onboarding@resend.dev` y destino en variable de entorno. No requiere dominio; el dominio propio se cambia luego solo con `CONTACT_FROM_EMAIL`.
- **Sí:** validación en servidor más honeypot. Cubre bots simples sin dependencias ni estado.
- **No:** rate limit ni CAPTCHA. Requieren almacenamiento o servicios externos; spec aparte si hay abuso.
- **Sí:** mantener la terminal de éxito de la plantilla como confirmación. Fiel al template por decisión del usuario.
- **Sí:** `reply_to` con el correo del visitante. Permite responder directo desde el buzón.
- **Sí:** mensaje de error genérico al fallar Resend y detalle solo en logs del servidor. No filtra información interna.
- **Sí:** usar `Reveal` existente en vez de repetir el `IntersectionObserver` de la plantilla.
- **Sí:** un único `status` (`idle | sending | success | error`) en el formulario en lugar de varios booleanos. Evita combinaciones imposibles y simplifica el renderizado.
- **No:** destinatario fijo en el código. Se lee de `CONTACT_TO_EMAIL`; con `onboarding@resend.dev` Resend solo entrega al correo de la cuenta propia.
- **No:** `/about` ni la etiqueta "SOBRE NOSOTROS". Se mantiene `/acerca-de` y "Acerca de", fieles a la plantilla y a las rutas en español.
- **No:** validar con librería (zod). Tres campos no justifican una dependencia.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `onboarding@resend.dev` solo entrega al correo de la cuenta Resend | `CONTACT_TO_EMAIL` debe ser ese correo en desarrollo; para otros destinos verificar un dominio y cambiar `CONTACT_FROM_EMAIL`. |
| Clave expuesta al cliente por error | Solo se lee `process.env.RESEND_API_KEY` en `app/api/contact/route.ts` (servidor); criterio de aceptación con `git grep` y revisión del bundle. |
| Abuso del formulario por bots | Honeypot y límites de longitud; rate limit queda para otra spec. |
| Inyección de cabeceras/HTML en el correo | Cuerpo de texto plano; asunto con el nombre sin saltos de línea (se eliminan). |
| Falta `RESEND_API_KEY` en el entorno | El endpoint responde `500` con un mensaje genérico y registra el motivo en el servidor; `npm run build` no debe fallar por ello. |
| Colisión de clases con `globals.css` (`.kicker`, `.field`, `.shake`) | Revisar duplicados antes de pegar y consolidar. |

## Lo que **no** entra en esta spec

- Gamepad y sus estilos.
- Dominio propio verificado, correo de confirmación al visitante o plantillas de correo.
- Rate limit, CAPTCHA o guardar mensajes en base de datos.
- Cualquier cambio en juegos, sesión, créditos o leaderboards.

Cada uno, si llega, va en su propia spec.
