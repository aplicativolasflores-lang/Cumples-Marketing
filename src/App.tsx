import { ChangeEvent, CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import floresLogo from "./imports/flores.png";

type Greeting = {
  title: string;
  message: string;
  buttonLabel: string;
  buttonUrl: string;
  audioUrl: string;
  backgroundColor: string;
};

const defaultGreeting: Greeting = {
  title: "Que viva el santo en las flores – Ángel Bedrillana",
  message:
    "Amaneció cielo azul, sol radiante de alegría, en el día de tu santo, que los cumplas muy felices. Se oyen guitarras, se regocijan corazones, ¡mil bendiciones, que viva el santo, traigan flores! Kuyana kusun en las flores.",
  buttonLabel: "¡Reserva con nosotros!",
  buttonUrl: "https://wa.me/51967456230",
  audioUrl: "",
  backgroundColor: "#1d541e",
};

const STORAGE_KEY = "las-flores-greeting";
const RESERVATION_MESSAGE =
  "Hola, buenos días. Me gustaría hacer una reserva. ¿Podrían ayudarme, por favor?";

function withGreetingDefaults(value: Partial<Greeting>): Greeting {
  const greeting = { ...defaultGreeting, ...value };
  if (greeting.buttonUrl === "https://wa.me/") {
    greeting.buttonUrl = defaultGreeting.buttonUrl;
  }
  return greeting;
}

function encodeGreeting(greeting: Greeting) {
  const shareableGreeting = {
    ...greeting,
    audioUrl: greeting.audioUrl.startsWith("data:") ? "" : greeting.audioUrl,
  };
  const bytes = new TextEncoder().encode(JSON.stringify(shareableGreeting));
  return btoa(String.fromCharCode(...bytes));
}

function greetingFromUrl() {
  const encoded = new URLSearchParams(window.location.search).get("g");
  if (!encoded) return null;

  try {
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    return withGreetingDefaults(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

function reservationUrl(buttonUrl: string) {
  try {
    const url = new URL(buttonUrl);
    url.searchParams.set("text", RESERVATION_MESSAGE);
    return url.toString();
  } catch {
    return buttonUrl;
  }
}

function GreetingCard({ greeting }: { greeting: Greeting }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReservationMessage, setShowReservationMessage] = useState(false);
  const whatsappReservationUrl = reservationUrl(greeting.buttonUrl);

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
    }
  }

  return (
    <>
      <main className="card">
      <div className="card-content">
        <img alt="Flores.ng" className="brand-logo" src={floresLogo} />
        <div className="greeting-copy">
          <h1>{greeting.title}</h1>
          <p>{greeting.message}</p>
        </div>

        <div className="audio-control">
          {greeting.audioUrl && (
            <audio
              aria-hidden="true"
              hidden
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              preload="none"
              ref={audioRef}
              src={greeting.audioUrl}
            />
          )}
          <button
            aria-label={
              !greeting.audioUrl
                ? "Audio no disponible"
                : isPlaying
                  ? "Pausar audio"
                  : "Escuchar dedicatoria"
            }
            aria-pressed={isPlaying}
            className="audio-toggle"
            disabled={!greeting.audioUrl}
            onClick={toggleAudio}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              {isPlaying ? (
                <path d="M8 5h3v14H8zM15 5h3v14h-3z" />
              ) : (
                <path d="m8 5 12 7-12 7z" />
              )}
            </svg>
            {!greeting.audioUrl
              ? "Audio no disponible"
              : isPlaying
                ? "Pausar audio"
                : "Escuchar dedicatoria"}
          </button>
        </div>

        <a
          className="reserve-button"
          href={greeting.buttonUrl}
          onClick={(event) => {
            event.preventDefault();
            setShowReservationMessage(true);
          }}
          rel="noreferrer"
          target="_blank"
        >
          {greeting.buttonLabel}
        </a>
      </div>
      </main>
      {showReservationMessage && (
      <div
        className="reservation-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowReservationMessage(false);
        }}
      >
        <section
          aria-labelledby="reservation-message-title"
          aria-modal="true"
          className="reservation-dialog"
          role="dialog"
        >
          <h2 id="reservation-message-title">Haz tu reserva</h2>
          <p>Para hacer tu reserva, continúa la conversación en WhatsApp.</p>
          <div className="reservation-actions">
            <button onClick={() => setShowReservationMessage(false)} type="button">
              Cancelar
            </button>
            <a href={whatsappReservationUrl} rel="noreferrer" target="_blank">
              Continuar a WhatsApp
            </a>
          </div>
        </section>
      </div>
    )}
    </>
  );
}

function AdminPanel({
  greeting,
  onSave,
  onExit,
}: {
  greeting: Greeting;
  onSave: (greeting: Greeting) => void;
  onExit: () => void;
}) {
  const [draft, setDraft] = useState(greeting);
  const [status, setStatus] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  function updateField(field: keyof Greeting, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setStatus("");
  }

  function handleAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 3.5 * 1024 * 1024) {
      setStatus("El archivo es demasiado grande. Usa un audio de hasta 3,5 MB o pega una URL.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateField("audioUrl", String(reader.result));
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!/^#[0-9a-fA-F]{6}$/.test(draft.backgroundColor)) {
      setStatus("Ingresa el color en formato hexadecimal, por ejemplo #1d541e.");
      return;
    }

    try {
      onSave(draft);
      setStatus("Cambios guardados en este dispositivo.");
    } catch {
      setStatus("No se pudo guardar. Prueba con una URL de audio o un archivo más pequeño.");
    }
  }

  return (
    <aside className="admin-panel">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Vista privada</span>
          <h2>Editar dedicatoria</h2>
        </div>
        <div className="admin-navigation">
          <button className="home-link" onClick={onExit} type="button">
            Volver al inicio
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          Título
          <input
            onChange={(event) => updateField("title", event.target.value)}
            value={draft.title}
          />
        </label>

        <label>
          Mensaje
          <textarea
            onChange={(event) => updateField("message", event.target.value)}
            rows={5}
            value={draft.message}
          />
        </label>

        <label>
          Color del fondo
          <div className="color-inputs">
            <input
              aria-label="Elegir color del fondo"
              className="color-picker"
              onChange={(event) => updateField("backgroundColor", event.target.value)}
              type="color"
              value={draft.backgroundColor}
            />
            <input
              aria-label="Código hexadecimal del color del fondo"
              className="color-code-input"
              maxLength={7}
              onChange={(event) => updateField("backgroundColor", event.target.value)}
              placeholder="#1d541e"
              spellCheck={false}
              type="text"
              value={draft.backgroundColor}
            />
          </div>
        </label>

        <div className="field-row">
          <label>
            Texto del botón
            <input
              onChange={(event) => updateField("buttonLabel", event.target.value)}
              value={draft.buttonLabel}
            />
          </label>
          <label>
            Enlace del botón
            <input
              onChange={(event) => updateField("buttonUrl", event.target.value)}
              type="url"
              value={draft.buttonUrl}
            />
          </label>
        </div>

        <fieldset>
          <legend>Audio</legend>
          <div className="audio-options">
            <button className="upload-button" onClick={() => fileInput.current?.click()} type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14" />
              </svg>
              Subir MP3
            </button>
            <span>o</span>
            <input
              aria-label="URL pública del audio"
              onChange={(event) => updateField("audioUrl", event.target.value)}
              placeholder="Pega una URL pública del audio"
              type="url"
              value={draft.audioUrl.startsWith("data:") ? "" : draft.audioUrl}
            />
            <input
              accept="audio/*"
              className="sr-only"
              onChange={handleAudio}
              ref={fileInput}
              type="file"
            />
          </div>
          {draft.audioUrl && (
            <button
              className="remove-audio"
              onClick={() => {
                updateField("audioUrl", "");
                if (fileInput.current) fileInput.current.value = "";
              }}
              type="button"
            >
              Quitar audio actual
            </button>
          )}
          <p className="field-help">
            Para que el audio funcione desde otros dispositivos, utiliza una URL pública. Los
            archivos subidos solo se guardan en este dispositivo.
          </p>
        </fieldset>

        <button className="save-button" type="submit">
          Guardar cambios
        </button>
        <p className="status" role="status">
          {status}
        </p>
      </form>

    </aside>
  );
}

export default function App() {
  const [greeting, setGreeting] = useState<Greeting>(() => {
    const sharedGreeting = greetingFromUrl();
    if (sharedGreeting) return sharedGreeting;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? withGreetingDefaults(JSON.parse(saved)) : defaultGreeting;
    } catch {
      return defaultGreeting;
    }
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin-session", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) return false;
        const result = (await response.json()) as { authenticated?: boolean };
        return result.authenticated === true;
      })
      .then((authenticated) => {
        if (active) setIsAdmin(authenticated);
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.title = isAdmin ? "Editar dedicatoria | Las Flores" : "Una dedicatoria para ti";
  }, [isAdmin]);

  async function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingLogin(true);
    setLoginStatus("");

    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      if (!response.ok) {
        const errorMessages: Record<number, string> = {
          401: "Usuario o contraseña incorrectos. Revisa los valores configurados en Vercel.",
          403: "Vercel bloqueó la solicitud. Abre la página desde el mismo dominio del sitio.",
          404: "No se encontró la función de acceso. Revisa el último despliegue de Vercel.",
          503: "Falta configurar ADMIN_USERNAME, ADMIN_PASSWORD o ADMIN_SESSION_SECRET en Production.",
        };
        setLoginStatus(
          errorMessages[response.status] ??
            `El servidor de acceso respondió con un error (${response.status}).`,
        );
        return;
      }

      setIsAdmin(true);
      setShowLogin(false);
      setLoginPassword("");
    } catch {
      setLoginStatus("No se pudo conectar con el servidor de acceso.");
    } finally {
      setIsSubmittingLogin(false);
    }
  }

  async function handleAdminLogout() {
    try {
      const response = await fetch("/api/admin-session", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (response.ok) setIsAdmin(false);
    } catch {
      // Keep the editor visible if the server could not end the session.
    }
  }

  function saveGreeting(nextGreeting: Greeting) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextGreeting));
    setGreeting(nextGreeting);
  }

  return (
    <div
      className={isAdmin ? "app-shell admin-mode" : "app-shell"}
      style={{ "--page-color": greeting.backgroundColor } as CSSProperties}
    >
      <button
        aria-label={isAdmin ? "Cerrar sesión de administrador" : "Acceso de administrador"}
        className="admin-lock"
        onClick={() => {
          if (isAdmin) {
            void handleAdminLogout();
          } else {
            setLoginStatus("");
            setShowLogin(true);
          }
        }}
        title={isAdmin ? "Cerrar sesión" : "Acceso de administrador"}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          {isAdmin ? (
            <>
              <rect height="11" rx="2" width="14" x="5" y="10" />
              <path d="M8 10V7a4 4 0 0 1 7.5-2" />
            </>
          ) : (
            <>
              <rect height="11" rx="2" width="14" x="5" y="10" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </>
          )}
        </svg>
      </button>
      <GreetingCard greeting={greeting} />
      {isAdmin && (
        <AdminPanel
          greeting={greeting}
          onExit={() => void handleAdminLogout()}
          onSave={saveGreeting}
        />
      )}
      {showLogin && (
        <div
          className="login-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmittingLogin) {
              setShowLogin(false);
            }
          }}
        >
          <section
            aria-labelledby="admin-login-title"
            aria-modal="true"
            className="login-dialog"
            role="dialog"
          >
            <button
              aria-label="Cerrar"
              className="login-close"
              disabled={isSubmittingLogin}
              onClick={() => setShowLogin(false)}
              type="button"
            >
              ×
            </button>
            <img alt="Flores.ng" className="login-logo" src={floresLogo} />
            <span className="eyebrow">Área privada</span>
            <h2 id="admin-login-title">Acceso de administrador</h2>
            <form onSubmit={handleAdminLogin}>
              <label>
                Usuario
                <input
                  autoComplete="username"
                  onChange={(event) => setLoginUsername(event.target.value)}
                  required
                  value={loginUsername}
                />
              </label>
              <label>
                Contraseña
                <input
                  autoComplete="current-password"
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                  type="password"
                  value={loginPassword}
                />
              </label>
              <p aria-live="polite" className="login-status" role="status">
                {loginStatus}
              </p>
              <button className="login-submit" disabled={isSubmittingLogin} type="submit">
                {isSubmittingLogin ? "Verificando..." : "Ingresar"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
