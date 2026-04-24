"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styles from "../admin/agentes/css/admin.module.css";
import ModalElegirCliente from "@/modules/auth/components/ModalElegirCliente/ModalElegirCliente";
import { useMenu } from "@/modules/auth/hooks/useMenu";
import { Providers } from "@/app/providers";

interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  perfilId: number;
  perfilNombre?: string;
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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem("usuario");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const localData = JSON.parse(userStr) as Usuario;
    setUsuario(localData);
    setCargando(false);
  }, [router]);

  useEffect(() => {
    const fetchPerfilData = async () => {
      if (usuario?.id && usuario?.clienteNombre && !usuario.perfilNombre) {
        try {
          const url = `/api/perfil/${usuario.id}?clienteNombre=${encodeURIComponent(usuario.clienteNombre)}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            setUsuario((prev) =>
              prev
                ? {
                    ...prev,
                    perfilNombre: data.perfilNombre,
                    perfilId: data.perfilId,
                  }
                : null,
            );
            const userStr = localStorage.getItem("usuario");
            if (userStr) {
              const user = JSON.parse(userStr);
              localStorage.setItem(
                "usuario",
                JSON.stringify({
                  ...user,
                  perfilNombre: data.perfilNombre,
                  perfilId: data.perfilId,
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
    if (usuario) {
      const updatedUser = {
        ...usuario,
        clienteNombre: result.clientDbName,
        perfilNombre: undefined,
      };
      localStorage.setItem("usuario", JSON.stringify(updatedUser));
      setUsuario(updatedUser);
    }
    setShowChangeClient(false);
    setIsUserMenuOpen(false);
  };

  if (cargando || !usuario)
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );

  const linkClass = (path: string) =>
    `${styles.navItem} ${pathname === path ? styles.active : ""}`;

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
    <Providers key={usuario.clienteNombre ?? "default"}>
      {" "}
      {/* ← key fuerza recrear QueryClient al cambiar cliente */}
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
            <Link href="/admin/agentes" className={linkClass("/admin/agentes")}>
              <span className="material-symbols-rounded">pending_actions</span>
              <span>Agentes</span>
            </Link>

            <Link
              href="/admin/sucursal"
              className={linkClass("/admin/sucursal")}
            >
              {/* CAMBIA ESTA LÍNEA DE ABAJO: de outlined a rounded */}
              <span className="material-symbols-rounded">gite</span>
              <span>Sucursal</span>
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
    </Providers>
  );
}
