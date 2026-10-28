import { Resend } from "resend";
type ContactoPeticion = { nombre: string; correo: string; mensaje: string; sitio_web?: string };
type ContactoRespuesta = { ok: true } | { ok: false; error: string };
const MAX_NOMBRE = 80;
const MAX_CORREO = 254;
const MAX_MENSAJE = 2000;
const CORREO_REMITENTE_POR_DEFECTO = "onboarding@resend.dev";
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERROR_ENVIO = "No pudimos enviar tu mensaje. Inténtalo de nuevo más tarde.";
function responder(cuerpo: ContactoRespuesta, status: number) {
  return Response.json(cuerpo, { status });
}
function textoDe(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}
// Devuelve el mensaje de error de validación, o null si la petición es válida.
function validar({ nombre, correo, mensaje }: ContactoPeticion): string | null {
  if (nombre.length < 1 || nombre.length > MAX_NOMBRE) {
    return `El nombre debe tener entre 1 y ${MAX_NOMBRE} caracteres.`;
  }
  if (correo.length > MAX_CORREO || !FORMATO_CORREO.test(correo)) {
    return "Introduce un correo electrónico válido.";
  }
  if (mensaje.length < 1 || mensaje.length > MAX_MENSAJE) {
    return `El mensaje debe tener entre 1 y ${MAX_MENSAJE} caracteres.`;
  }
  return null;
}
export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder({ ok: false, error: "La petición no es un JSON válido." }, 400);
  }
  if (typeof cuerpo !== "object" || cuerpo === null) {
    return responder({ ok: false, error: "La petición no es un JSON válido." }, 400);
  }
  const datos = cuerpo as Record<string, unknown>;
  // Honeypot: un bot lo rellena; respondemos éxito sin enviar nada.
  if (textoDe(datos.sitio_web) !== "") {
    return responder({ ok: true }, 200);
  }
  const peticion: ContactoPeticion = {
    nombre: textoDe(datos.nombre),
    correo: textoDe(datos.correo),
    mensaje: textoDe(datos.mensaje),
  };
  const errorDeValidacion = validar(peticion);
  if (errorDeValidacion) {
    return responder({ ok: false, error: errorDeValidacion }, 400);
  }
  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !destino) {
    console.error("[contact] Falta RESEND_API_KEY o CONTACT_TO_EMAIL en el entorno.");
    return responder({ ok: false, error: ERROR_ENVIO }, 500);
  }
  // Sin saltos de línea en el asunto para evitar inyección de cabeceras.
  const nombreEnAsunto = peticion.nombre.replace(/[\r\n]+/g, " ");
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.CONTACT_FROM_EMAIL || CORREO_REMITENTE_POR_DEFECTO,
      to: destino,
      replyTo: peticion.correo,
      subject: `[Arcade Vault] Mensaje de ${nombreEnAsunto}`,
      text: `Nombre: ${peticion.nombre}\nCorreo: ${peticion.correo}\n\n${peticion.mensaje}`,
    });
    if (error) {
      console.error("[contact] Resend rechazó el envío:", error);
      return responder({ ok: false, error: ERROR_ENVIO }, 500);
    }
  } catch (error) {
    console.error("[contact] Fallo al llamar a Resend:", error);
    return responder({ ok: false, error: ERROR_ENVIO }, 500);
  }
  return responder({ ok: true }, 200);
}
