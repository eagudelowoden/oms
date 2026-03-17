"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.css";
import ModalElegirCliente from "../../../src/app/_modulos/auth/components/ModalElegirCliente/ModalElegirCliente";

// --- INTERFACES ---
interface Usuario {
  id: number;
  nombre: string;
  rol: string;
  clienteNombre?: string;
}

interface ClientSwitchResult {
  clientToken: string;
  clientDb: string;     // Nombre Comercial
  clientDbName: string; // dbase técnico
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showChangeClient, setShowChangeClient] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem("usuario");
    if (!userStr) {
      router.push("/login");
    } else {
      try {
        setUsuario(JSON.parse(userStr) as Usuario);
      } catch {
        localStorage.clear();
        router.push("/login");
      } finally {
        setCargando(false);
      }
    }
  }, [router]);

  // Cerrar sidebar al navegar en móvil
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      localStorage.clear();
      router.push("/login");
      router.refresh();
    }
  };

  const handleClientSwitchSuccess = (result: ClientSwitchResult): void => {
    if (usuario) {
      const updatedUser: Usuario = {
        ...usuario,
        clienteNombre: result.clientDb,
      };
      localStorage.setItem("usuario", JSON.stringify(updatedUser));
      setUsuario(updatedUser);
    }
    setShowChangeClient(false);
    router.refresh();
  };

  if (cargando) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
    </div>
  );
  
  if (!usuario) return null;

  const linkClass = (path: string): string =>
    `${styles.navItem} ${pathname === path ? styles.active : ""}`;

  return (
    <div className={styles.adminWrapper}>
      {/* Overlay para móviles */}
      <div
        className={`${styles.mobileOverlay} ${isSidebarOpen ? styles.showOverlay : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoGroup}>
            <div className={styles.logoBadge}>
              <span className="material-symbols-rounded">warehouse</span>
            </div>
            <span className={styles.logoText}>OMS</span>
          </div>
          <button className={styles.closeMenuMobile} onClick={() => setIsSidebarOpen(false)}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* INDICADOR DE CLIENTE ACTUAL */}
        <div className={styles.currentClientBadge}>
          <span className="material-symbols-rounded">domain</span>
          <div className={styles.clientInfo}>
            <small>Cliente Actual:</small>
            <p>{usuario.clienteNombre || "Sin seleccionar"}</p>
          </div>
        </div>

        <nav className={styles.navMenu}>
          <p className={styles.navSectionTitle}>Módulos</p>
          <Link href="/admin" className={linkClass("/admin")}>
            <span className="material-symbols-rounded">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/preAlertaAgente" className={linkClass("/admin/preAlertaAgente")}>
            <span className="material-symbols-rounded">pending_actions</span>
            <span>Pre-Alerta Agente</span>
          </Link>
          {usuario.rol === "ADMIN" && (
            <Link href="/admin/usuarios" className={linkClass("/admin/usuarios")}>
              <span className="material-symbols-rounded">group</span>
              <span>Usuarios</span>
            </Link>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.changeClientBtn} onClick={() => setShowChangeClient(true)}>
            <span className="material-symbols-rounded">sync_alt</span>
            <span>Cambiar Cliente</span>
          </button>

          <div className={styles.userProfile}>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{usuario.nombre}</p>
              <p className={styles.userRole}>{usuario.rol}</p>
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn} title="Cerrar sesión">
              <span className="material-symbols-rounded">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <button className={styles.hamburger} onClick={() => setIsSidebarOpen(true)}>
            <span className="material-symbols-rounded">menu</span>
          </button>
          <div className={styles.headerBreadcrumb}>
            OMS System / {pathname.split("/").pop()?.replace(/-/g, " ")}
          </div>
        </header>

        <div className={styles.pageContainer}>{children}</div>
      </main>

      {/* MODAL CAMBIO CLIENTE */}
      {showChangeClient && (
        <ModalElegirCliente
          usuarioId={usuario.id}
          onSuccess={handleClientSwitchSuccess}
          onCancel={() => setShowChangeClient(false)}
        />
      )}
    </div>
  );
}