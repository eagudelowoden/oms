"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../(admin)/admin.module.css";

export interface MenuItem {
  id: number;
  descripcion: string;
  accion: string;
  children?: MenuItem[];
}

export default function MenuItemComponent({
  item,
  onNavigate,
}: {
  item: MenuItem;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setOpen(!open);
    } else {
      router.push(`/admin/${item.accion.toLowerCase()}`);
      onNavigate();
    }
  };

  return (
    <div>
      <button onClick={handleClick} className={styles.navItem}>
        <span className="material-symbols-rounded">chevron_right</span>
        <span>{item.descripcion}</span>
        {hasChildren && (
          <span className="material-symbols-rounded">
            {open ? "expand_less" : "expand_more"}
          </span>
        )}
      </button>

      {hasChildren && open && (
        <div style={{ paddingLeft: "16px" }}>
          {item.children!.map((child: MenuItem) => (
            <MenuItemComponent
              key={child.id}
              item={child}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
