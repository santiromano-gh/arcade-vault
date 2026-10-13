"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "success" | "error";

const EMPTY_FORM = { nombre: "", correo: "", mensaje: "", sitio_web: "" };
const SHAKE_MS = 400;
const ERROR_RED = "No pudimos enviar tu mensaje. Inténtalo de nuevo más tarde.";

export function ContactForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [sentName, setSentName] = useState("");

  const update = (field: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const fail = (message: string) => {
    setError(message);
    setStatus("error");
    setShake(true);
    setTimeout(() => setShake(false), SHAKE_MS);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;

    if (!form.nombre.trim() || !form.correo.trim() || !form.mensaje.trim()) {
      fail("Completa nombre, correo y mensaje para enviar.");
      return;
    }

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data: { ok: boolean; error?: string } = await res.json();
      if (!res.ok || !data.ok) {
        fail(data.error ?? ERROR_RED);
        return;
      }
      setSentName(form.nombre.trim());
      setStatus("success");
    } catch {
      fail(ERROR_RED);
    }
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setSentName("");
    setError("");
    setStatus("idle");
  };

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={onSubmit} noValidate>
      {status !== "success" ? (
        <>
          <div className="field">
            <label htmlFor="contact-nombre">NOMBRE</label>
            <input
              id="contact-nombre"
              name="nombre"
              value={form.nombre}
              onChange={(e) => update("nombre")(e.target.value)}
              placeholder="px_kai"
              maxLength={80}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-correo">CORREO ELECTRÓNICO</label>
            <input
              id="contact-correo"
              name="correo"
              type="email"
              value={form.correo}
              onChange={(e) => update("correo")(e.target.value)}
              placeholder="jugador@vault.gg"
              maxLength={254}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-mensaje">MENSAJE</label>
            <textarea
              id="contact-mensaje"
              name="mensaje"
              rows={5}
              value={form.mensaje}
              onChange={(e) => update("mensaje")(e.target.value)}
              placeholder="Cuéntanos qué tienes en mente…"
              maxLength={2000}
            />
          </div>
          {/* Honeypot: invisible para personas, los bots suelen rellenarlo. */}
          <input
            name="sitio_web"
            value={form.sitio_web}
            onChange={(e) => update("sitio_web")(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />
          {status === "error" && (
            <div role="alert" className="pixel" style={{ color: "var(--magenta)", fontSize: 10, lineHeight: 1.7, marginBottom: 14 }}>
              {error}
            </div>
          )}
          <button
            className="btn xl press"
            type="submit"
            style={{ width: "100%" }}
            disabled={status === "sending"}
          >
            {status === "sending" ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r" />
            <span className="dot y" />
            <span className="dot g" />
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success" role="status">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {sentName.toUpperCase()}.
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={reset}>
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
