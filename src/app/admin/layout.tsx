"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.css";

interface Usuario {
  nombre: string;
  rol: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para móviles
  
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

  // Cerrar sidebar al cambiar de ruta (en móviles)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const linkClass = (path: string) => 
    `${styles.navItem} ${pathname === path ? styles.active : ""}`;

  if (cargando) return <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>;
  if (!usuario) return null;

  return (
    <div className={styles.adminWrapper}>
      {/* Overlay para móviles: cierra el menú al tocar fuera */}
      {isSidebarOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBadge}>
            <span className="material-symbols-rounded">warehouse</span>
          </div>
          <span className={styles.logoText}>OMS Admin</span>
          <button className={styles.closeMenuMobile} onClick={() => setIsSidebarOpen(false)}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <nav className={styles.navMenu}>
          <p className={styles.navSectionTitle}>Módulos</p>
          
          <Link href="/admin" className={linkClass("/admin")}>
            <span className="material-symbols-rounded">dashboard</span>
            <span>Pre - Alerta Agente</span>
          </Link>

          {usuario.rol === "ADMIN" && (
            <Link href="/admin/usuarios" className={linkClass("/admin/usuarios")}>
              <span className="material-symbols-rounded">group</span>
              <span>Usuarios</span>
            </Link>
          )}

          <Link href="/admin/inventario" className={linkClass("/admin/inventario")}>
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
            onClick={() => { localStorage.clear(); router.push("/login"); }} 
            className={styles.logoutBtn}
          >
            <span className="material-symbols-rounded">logout</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <button className={styles.hamburger} onClick={() => setIsSidebarOpen(true)}>
            <span className="material-symbols-rounded">menu</span>
          </button>
          <div className={styles.headerTitle}>
             {/* Aquí podrías poner el nombre de la sección actual */}
          </div>
        </header>
        
        <div className={styles.pageContainer}>
          {children}
        </div>
      </main>
    </div>
  );
}