import React from "react";
import styles from "../prealerta.module.css";
import { PrealertaItem } from "../hooks/usePrealerta";

/* ── CONFIRM MODAL ── */
interface ConfirmProps {
  item: PrealertaItem | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ item, onCancel, onConfirm }: ConfirmProps) {
  if (!item) return null;
  return (
    <div className={styles.confirmOverlay} onClick={onCancel}>
      <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="9"/>
            <line x1="12" y1="8" x2="12" y2="13"/>
            <circle cx="12" cy="16.5" r=".5" fill="currentColor"/>
          </svg>
        </div>
        <p className={styles.confirmTitle}>¿Eliminar prealerta?</p>
        <p className={styles.confirmSub}>{item.nombre}</p>
        <div className={styles.confirmBtns}>
          <button type="button" className={styles.confirmCancel} onClick={onCancel}>Cancelar</button>
          <button type="button" className={styles.confirmDelete} onClick={onConfirm}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ── TOAST ── */
interface ToastProps {
  toast: { msg: string; type: "ok" | "error" } | null;
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  return (
    <div className={`${styles.toast} ${toast.type === "error" ? styles.toastError : styles.toastOk}`}>
      {toast.msg}
    </div>
  );
}
