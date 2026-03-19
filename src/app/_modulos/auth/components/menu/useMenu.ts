import { useState, useEffect } from "react";

export interface MenuItem {
  id: string;
  descripcion: string;
  tipo: string;
  orden: number;
  accion: string;
  estado: string;
  icono: string;
  id_padre: string;
  view_name: string;
  controller_name: string;
  children?: MenuItem[];
}

const ROOT_EXCLUDE = new Set(["ADM", "INF", "ORD"]);
const INV_EXCLUDE = new Set(["ICIC"]);
const LOG_EXCLUDE = new Set(["LSEP", "LSCR"]);
const PROD_EXCLUDE = new Set(["PINN", "PSMART"]);

function applyFilters(items: MenuItem[], parentId: string): MenuItem[] {
  if (parentId === "0") return items.filter((i) => !ROOT_EXCLUDE.has(i.id));
  if (parentId === "INV") return items.filter((i) => !INV_EXCLUDE.has(i.id));
  if (parentId === "LOG") return items.filter((i) => !LOG_EXCLUDE.has(i.id));
  if (parentId === "PROD") return items.filter((i) => !PROD_EXCLUDE.has(i.id));
  return items;
}

async function fetchItems(idPerfil: number, id: string): Promise<MenuItem[]> {
  const res = await fetch(
    `/api/menu?idPerfil=${idPerfil}&id=${encodeURIComponent(id)}`,
  );
  if (!res.ok) return [];
  return res.json();
}

async function loadRecursive(
  idPerfil: number,
  parentId: string,
): Promise<MenuItem[]> {
  const raw = await fetchItems(idPerfil, parentId);
  const filtered = applyFilters(raw, parentId);

  return Promise.all(
    filtered.map(async (item) => {
      if (item.tipo === "menu") {
        const children = await loadRecursive(idPerfil, item.id);
        return { ...item, children };
      }
      return { ...item, children: [] };
    }),
  );
}

export function useMenu(perfilId: number | undefined) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  useEffect(() => {
    if (!perfilId) return;

    async function load() {
      setLoadingMenu(true);
      try {
        const items = await loadRecursive(perfilId!, "0");
        setMenu(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMenu(false);
      }
    }

    load();
  }, [perfilId]);

  return { menu, loadingMenu };
}
