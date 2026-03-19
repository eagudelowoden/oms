"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
// 1. IMPORTAR EL COMPONENTE
import ModalElegirCliente from "../../app/_modulos/auth/components/ModalElegirCliente/ModalElegirCliente";

// --- INTERFACES PARA TYPESCRIPT ---
interface LoginFormInputs {
  username: string;
  password: string;
}

// Estructura del usuario según tu Backend
interface Usuario {
  id: number;
  nombre: string;
  username: string;
  // Añade otros campos si tu API los devuelve (rol, cargo, etc.)
}

// Resultado del switch de cliente
interface ClientSwitchResponse {
  clientToken: string;
  clientDb: string;
  clientDbName: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2. ESTADOS TIPADOS CORRECTAMENTE (Sin 'any')
  const [showModal, setShowModal] = useState(false);
  const [tempUserData, setTempUserData] = useState<Usuario | null>(null);

  const router = useRouter();
  const { register, handleSubmit } = useForm<LoginFormInputs>();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      html.classList.add("dark");
      setIsDarkMode(true);
    }
  };

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (response.ok) {
        // 3. CAMBIO CLAVE: Guardamos usuario tipado y abrimos modal
        localStorage.setItem("token", result.token);
        setTempUserData(result.usuario as Usuario);
        setShowModal(true);
      } else {
        setError(result.message || "Credenciales inválidas");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. FUNCIÓN AL SELECCIONAR CLIENTE CON ÉXITO
  const handleClientSuccess = (clientData: ClientSwitchResponse) => {
    localStorage.setItem("token", clientData.clientToken);
    localStorage.setItem("clientDb", clientData.clientDb);

    if (tempUserData) {
      localStorage.setItem(
        "usuario",
        JSON.stringify({
          ...tempUserData,
          clienteNombre: clientData.clientDbName, // 👈 línea nueva
        }),
      );
    }

    router.push("/admin");
  };

  return (
    <div className={styles.mainWrapper}>
      <button
        type="button"
        onClick={toggleDarkMode}
        className={styles.themeButton}
      >
        <span
          className={`material-symbols-rounded ${isDarkMode ? styles.sunIcon : styles.moonIcon}`}
        >
          {isDarkMode ? "light_mode" : "dark_mode"}
        </span>
      </button>

      <div className={styles.centerContainer}>
        <div className={styles.logoSection}>
          <div className={styles.logoIconBox}>
            <span className="material-symbols-rounded">warehouse</span>
          </div>
          <h2 className={styles.logoText}>OMS</h2>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1>Bienvenido</h1>
            <p>Acceso al sistema</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {error && (
              <div className={styles.errorAlert}>
                <span className="material-symbols-rounded">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label}>Usuario</label>
              <div className={styles.relative}>
                <span
                  className={`material-symbols-rounded ${styles.inputIcon}`}
                >
                  person
                </span>
                <input
                  {...register("username", { required: true })}
                  className={styles.inputField}
                  placeholder="Usuario"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Contraseña</label>
              <div className={styles.relative}>
                <span
                  className={`material-symbols-rounded ${styles.inputIcon}`}
                >
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", { required: true })}
                  className={styles.inputField}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeButton}
                >
                  <span className="material-symbols-rounded">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  <span>INGRESAR</span>
                  <span className="material-symbols-rounded">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
        <p className={styles.footerText}>WODEN DEV &bull; v1.0</p>
      </div>

      {/* 5. RENDERIZAR EL MODAL */}
      {showModal && tempUserData && (
        <ModalElegirCliente
          usuarioId={tempUserData.id}
          onCancel={() => setShowModal(false)}
          onSuccess={handleClientSuccess}
        />
      )}
    </div>
  );
}
