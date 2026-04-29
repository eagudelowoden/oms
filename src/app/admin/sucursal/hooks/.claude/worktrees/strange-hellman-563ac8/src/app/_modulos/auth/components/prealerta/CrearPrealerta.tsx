"use client";
import { useState } from "react";

export default function CrearPrealerta({ usuarioId }: { usuarioId: number }) {
  const [formData, setFormData] = useState({
    nombre: "",
    guia: "",
    tipoOrigenId: 1, // Valores de ejemplo
    origenId: 10,
    idResponsable: usuarioId,
    estado: "PENDIENTE"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/prealerta/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, usuarioId })
      });
      
      if (res.ok) {
        alert("Prealerta creada con éxito!");
        setFormData({ ...formData, nombre: "", guia: "" }); // Limpiar
      }
    } catch (error) {
      console.error("Error al crear:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
      <input 
        placeholder="Nombre de Prealerta" 
        value={formData.nombre}
        onChange={e => setFormData({...formData, nombre: e.target.value})}
        required 
      />
      <input 
        placeholder="Número de Guía" 
        value={formData.guia}
        onChange={e => setFormData({...formData, guia: e.target.value})}
        required 
      />
      <button type="submit">Guardar Prealerta</button>
    </form>
  );
}