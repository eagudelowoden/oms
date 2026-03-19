"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.css";
import ModalElegirCliente from "../../../src/app/_modulos/auth/components/ModalElegirCliente/ModalElegirCliente";
import { useMenu } from "../_modulos/auth/components/menu/useMenu";

// --- INTERFACES ACTUALIZADAS ---
interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  perfilId: number;
  perfilNombre?: string; // Aquí guardaremos lo que traiga el SP
  nombreUsuario: string;
  clienteNombre?: string;
}

interface ClientSwitchResult {
  clientToken: string;
  clientDb: string;
  clientDbName: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showChangeClient, setShowChangeClient] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { menu, loadingMenu } = useMenu(usuario?.perfilId);
  console.log("🎯 perfilId para menú:", usuario?.perfilId);
  console.log("📋 menu cargado:", menu);

  const router = useRouter();
  const pathname = usePathname();

  // EFECTO 1: Solo carga el usuario base del localStorage al arrancar
  useEffect(() => {
    const userStr = localStorage.getItem("usuario");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const localData = JSON.parse(userStr) as Usuario;
    console.log("👤 Usuario desde localStorage:", localData);
    console.log("🏢 clienteNombre:", localData.clienteNombre);
    console.log("🆔 id:", localData.id);
    setUsuario(localData);
    setCargando(false);
  }, [router]);

  // EFECTO 2: Reacciona al cambio de cliente y pide el perfil (El "SwitchMap" de Angular)
  useEffect(() => {
    const fetchPerfilData = async () => {
      if (usuario?.id && usuario?.clienteNombre && !usuario.perfilNombre) {
        try {
          const url = `/api/perfil/${usuario.id}?clienteNombre=${encodeURIComponent(usuario.clienteNombre)}`;

          console.log(
            "📡 Disparando petición de perfil para:",
            usuario.clienteNombre,
          );

          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            console.log('📦 data recibida del perfil:', data); // 👈 agrega esto

            // Actualizamos estado con perfilNombre Y perfilId
            setUsuario((prev) =>
              prev
                ? {
                    ...prev,
                    perfilNombre: data.perfilNombre,
                    perfilId: data.perfilId, // 👈
                  }
                : null,
            );

            // Guardamos en localStorage también
            const userStr = localStorage.getItem("usuario");
            if (userStr) {
              const user = JSON.parse(userStr);
              localStorage.setItem(
                "usuario",
                JSON.stringify({
                  ...user,
                  perfilNombre: data.perfilNombre,
                  perfilId: data.perfilId, // 👈
                }),
              );
            }
          }
        } catch (error) {
          console.error("❌ Error en fetch perfil:", error);
        }
      }
    };

    fetchPerfilData();
  }, [usuario?.id, usuario?.clienteNombre, usuario?.perfilNombre]);

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      localStorage.clear();
      router.push("/login");
      router.refresh();
    }
  };

  const handleClientSwitchSuccess = (result: ClientSwitchResult) => {
    console.log("🔄 result completo:", result); // 👈 agrega esto
    if (usuario) {
      const updatedUser = {
        ...usuario,
        clienteNombre: result.clientDb, // El nombre que viene del modal
        perfilNombre: undefined, // 👈 IMPORTANTE: Limpiar para que el useEffect se dispare
      };

      localStorage.setItem("usuario", JSON.stringify(updatedUser));
      setUsuario(updatedUser);
    }
    setShowChangeClient(false);
    setIsUserMenuOpen(false);
    // router.refresh(); // Opcional, con setUsuario(updatedUser) debería bastar
  };

  if (cargando || !usuario)
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );

  const linkClass = (path: string) =>
    `${styles.navItem} ${pathname === path ? styles.active : ""}`;

  // --- COMPONENTE DE MENÚ ---
  const UserMenuComponent = () => (
    <div className={styles.userMenuWrapper}>
      {isUserMenuOpen && (
        <div className={styles.userOptionsPanel}>
          <button
            className={styles.optionBtn}
            onClick={() => setShowChangeClient(true)}
          >
            <span className="material-symbols-rounded">sync_alt</span>
            <span>Cambiar Cliente</span>
          </button>
          <div className={styles.divider}></div>
          <button
            className={`${styles.optionBtn} ${styles.logoutOption}`}
            onClick={handleLogout}
          >
            <span className="material-symbols-rounded">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
      <button
        className={styles.userProfileTrigger}
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
      >
        <div className={styles.userAvatar}>
          {usuario.nombres?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className={styles.userInfoHideMobile}>
          <p className={styles.userName}>{usuario.nombres?.split(" ")[0]}</p>
          <p className={styles.userRole}>
            {usuario.perfilNombre ||
              (usuario.perfilId === 1 ? "ADMIN" : "USER")}
          </p>
        </div>
        <span
          className={`material-symbols-rounded ${styles.arrowIcon} ${isUserMenuOpen ? styles.rotate : ""}`}
        >
          expand_less
        </span>
      </button>
    </div>
  );

  return (
    <div className={styles.adminWrapper}>
      <div
        className={`${styles.mobileOverlay} ${isSidebarOpen ? styles.showOverlay : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside
        className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoGroup}>
            <div className={styles.logoBadge}>
              <span className="material-symbols-rounded">warehouse</span>
            </div>
            <span className={styles.logoText}>OMS</span>
          </div>
          <button
            className={styles.closeMenuMobile}
            onClick={() => setIsSidebarOpen(false)}
          >
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* INFO SESIÓN MINIMALISTA */}
        <div className={styles.currentClientBadge}>
          <div className={styles.sessionInfoGroup}>
            <div className={styles.infoRow}>
              <span className="material-symbols-rounded">domain</span>
              <div className={styles.infoText}>
                <p className={styles.clientName}>
                  {usuario.clienteNombre || "Sin seleccionar"}
                </p>
              </div>
            </div>
            <div className={styles.infoRow}>
              <span className="material-symbols-rounded">person</span>
              <div className={styles.infoText}>
                <p className={styles.userName}>
                  {`${usuario.nombres} ${usuario.apellidos}` || "Usuario"}
                  <span className={styles.roleTag}>
                    {usuario.perfilNombre || "Cargando..."}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className={styles.navMenu}>
          <p className={styles.navSectionTitle}>Módulos</p>
          <Link href="/admin" className={linkClass("/admin")}>
            <span className="material-symbols-rounded">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link
            href="/admin/preAlertaAgente"
            className={linkClass("/admin/preAlertaAgente")}
          >
            <span className="material-symbols-rounded">pending_actions</span>
            <span>Pre-Alerta</span>
          </Link>
          {usuario.perfilId === 1 && (
            <Link
              href="/admin/usuarios"
              className={linkClass("/admin/usuarios")}
            >
              <span className="material-symbols-rounded">group</span>
              <span>Usuarios</span>
            </Link>
          )}
        </nav>

        <div className={styles.sidebarFooterDesktop}>
          <UserMenuComponent />
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <button
              className={styles.hamburger}
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-rounded">menu</span>
            </button>
            <div className={styles.headerBreadcrumb}>
              OMS System / {pathname.split("/").pop()}
            </div>
          </div>
          <div className={styles.headerUserMobile}>
            <UserMenuComponent />
          </div>
        </header>
        <div className={styles.pageContainer}>{children}</div>
      </main>

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
