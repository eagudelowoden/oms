"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

interface LoginFormInputs {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        localStorage.setItem("token", result.token);
        localStorage.setItem("usuario", JSON.stringify(result.usuario));
        router.push("/admin");
      } else {
        setError(result.message || "Credenciales inválidas");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.mainWrapper}>
      {/* Botón Switch de Tema */}
      <button
        type="button"
        onClick={toggleDarkMode}
        className={styles.themeButton}
      >
        <span
          className="material-symbols-rounded"
          style={{
            color: isDarkMode ? "#60a5fa" : "#f59e0b",
            fontSize: "20px",
            display: "block",
          }}
        >
          {isDarkMode ? "light_mode" : "dark_mode"}
        </span>
      </button>

      {/* Contenedor Central para Logo + Tarjeta */}
      <div className={styles.centerContainer}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoIconBox}>
            <span className="material-symbols-rounded" style={{ color: "white", fontSize: "24px" }}>
              warehouse
            </span>
          </div>
          <h2 className={styles.logoText}>OMS</h2>
        </div>

        {/* Tarjeta de Login */}
        <div className={styles.card}>
          <div style={{ marginBottom: "1.5rem", textAlign: "left" }}>
            <h1 style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
              Bienvenido
            </h1>
            <p style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>
              Acceso al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
            {error && (
              <div className={styles.errorAlert}>
                <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>error</span>
                <span style={{ fontWeight: "bold" }}>{error}</span>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label}>Usuario</label>
              <div className={styles.relative}>
                <span className={`material-symbols-rounded ${styles.inputIcon}`}>person</span>
                <input
                  {...register("username", { required: true })}
                  className={styles.inputField}
                  placeholder="e.agudelo"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Contraseña</label>
              <div className={styles.relative}>
                <span className={`material-symbols-rounded ${styles.inputIcon}`}>lock</span>
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
                  <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>
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
                <div className="spinner" />
              ) : (
                <>
                  <span>INGRESAR</span>
                  <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className={styles.footerText}>
          WODEN DEV &bull; v1.0
        </p>
      </div>

      <style jsx>{`
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}