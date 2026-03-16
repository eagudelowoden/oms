"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.css";

interface Usuario {
  nombre: string;
  rol: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem("usuario");
    if (!userStr) {
      router.push("/login");
    } else {
      try {
        setUsuario(JSON.parse(userStr));
      } catch (error) {
        localStorage.clear();
        router.push("/login");
      } finally {
        setCargando(false);
      }
    }
  }, [router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // FUNCIÓN DE LOGOUT SINCRONIZADA
  const handleLogout = async () => {
    try {
      // 1. Llamada al API para borrar la cookie
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Error al invalidar cookie");
    } finally {
      // 2. Limpiar localstorage y redirigir pase lo que pase
      localStorage.clear();
      router.push("/login");
      router.refresh(); // Limpia caché de rutas
    }
  };

  const linkClass = (path: string) =>
    `${styles.navItem} ${pathname === path ? styles.active : ""}`;

  if (cargando)
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  if (!usuario) return null;

  return (
    <div className={styles.adminWrapper}>
      {isSidebarOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBadge}>
            <span className="material-symbols-rounded">warehouse</span>
          </div>
          <span className={styles.logoText}>OMS</span>
          <button
            className={styles.closeMenuMobile}
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <nav className={styles.navMenu}>
          <p className={styles.navSectionTitle}>Módulos</p>

          {/* Link al Home del Admin */}
          <Link href="/admin" className={linkClass("/admin")}>
            <span className="material-symbols-rounded">dashboard</span>
            <span>Dashboard</span>
          </Link>

          {/* EL NUEVO MÓDULO AQUÍ */}
          <Link
            href="/admin/preAlertaAgente"
            className={linkClass("/admin/preAlertaAgente")}
          >
            <span className="material-symbols-rounded">pending_actions</span>
            <span>Pre - Alerta Agente</span>
          </Link>

          {usuario.rol === "ADMIN" && (
            <Link
              href="/admin/usuarios"
              className={linkClass("/admin/usuarios")}
            >
              <span className="material-symbols-rounded">group</span>
              <span>Usuarios</span>
            </Link>
          )}

          <Link
            href="/admin/inventario"
            className={linkClass("/admin/inventario")}
          >
            <span className="material-symbols-rounded">inventory_2</span>
            <span>Pre - Alerta Acopio</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{usuario.nombre}</p>
            <p className={styles.userRole}>{usuario.rol}</p>
          </div>
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Cerrar sesión"
          >
            <span className="material-symbols-rounded">logout</span>
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <button
            className={styles.hamburger}
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="material-symbols-rounded">menu</span>
          </button>
          <div className={styles.headerTitle}>
            {/* Opcional: Nombre de ruta dinámica */}
          </div>
        </header>

        <div className={styles.pageContainer}>{children}</div>
      </main>
    </div>
  );
}
