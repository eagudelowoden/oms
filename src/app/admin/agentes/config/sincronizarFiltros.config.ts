// src/app/admin/preAlertaAgente/config/sincronizarFiltros.config.ts

export interface FiltroConfig {
  key: string; // nombre del campo en la respuesta de la API
  valor: unknown; // valor esperado para que pase el filtro
  activo: boolean; // si está activo por defecto
  label: string; // etiqueta para mostrar en UI (futuro)
}

export interface ProyectoConfig {
  id: number;
  nombre: string;
  filtros: FiltroConfig[];
}

export const PROYECTOS_CONFIG: ProyectoConfig[] = [
  {
    id: 1,
    nombre: "WODEN",
    filtros: [
      {
        key: "gestion_exitosa",
        valor: true,
        activo: true,
        label: "Gestión exitosa",
      },
      {
        key: "tipo_cierre",
        valor: "RECUPERADO WODEN",
        activo: true,
        label: "Tipo de cierre",
      },
      {
        key: "id_proyecto",
        valor: 1,
        activo: true,
        label: "Proyecto",
      },
    ],
  },
  // Para agregar un nuevo proyecto en el futuro:
  // {
  //   id: 2,
  //   nombre: "OTRO_PROYECTO",
  //   filtros: [
  //     { key: "gestion_exitosa", valor: true, activo: true, label: "Gestión exitosa" },
  //     { key: "tipo_cierre", valor: "OTRO_TIPO", activo: true, label: "Tipo de cierre" },
  //     { key: "id_proyecto", valor: 2, activo: true, label: "Proyecto" },
  //   ],
  // },
];

// Función reutilizable que aplica los filtros activos de un proyecto
export function aplicarFiltros(
  registros: Array<Record<string, unknown>>,
  proyectoId: number,
): Array<Record<string, unknown>> {
  const proyecto = PROYECTOS_CONFIG.find((p) => p.id === proyectoId);
  if (!proyecto) return registros;

  const filtrosActivos = proyecto.filtros.filter((f) => f.activo);

  return registros.filter((r) =>
    filtrosActivos.every((f) => r[f.key] === f.valor),
  );
}
