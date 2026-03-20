'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '../../../components/Sidebar';
import { apiRequest } from '../../../lib/api';

type TallerConfigState = {
  tipoTaller: string;
  proximaOrden: string;
  referenciaExterna: 'visible' | 'no_visible';
  tipoEquipo: 'visible' | 'no_visible';
  solicitarFirma: 'si' | 'no';
  solicitarEncuesta: 'visible' | 'oculto';
  tipoEncuesta: 'estrellas' | 'nps';
  textoLibre: 'permitido' | 'no_permitido';
  correoCliente: 'visible' | 'ocultar';
  telefonoCliente: 'visible' | 'ocultar';
  eliminacionOrdenes: 'todos' | 'solo_admin' | 'nadie';
};

const STORAGE_KEY = 'taller_config_general_v1';

const initialState: TallerConfigState = {
  tipoTaller: 'Ninguno de la lista',
  proximaOrden: '320',
  referenciaExterna: 'no_visible',
  tipoEquipo: 'visible',
  solicitarFirma: 'no',
  solicitarEncuesta: 'visible',
  tipoEncuesta: 'estrellas',
  textoLibre: 'permitido',
  correoCliente: 'ocultar',
  telefonoCliente: 'ocultar',
  eliminacionOrdenes: 'todos',
};

const tabs = [
  'General',
  'Área cliente',
  'Tabla',
  'PDF (Ingreso)',
  'PDF (Salida)',
  'PDF Adicional (Salida)',
  'PDF (Reporte)',
  'Etiquetas',
];

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="mt-6 border-b border-gray-300 pb-2 text-[14px] font-semibold tracking-wide text-[#2f3441]">
      {children}
    </h3>
  );
}

export default function ConfiguracionGeneralPage() {
  const [form, setForm] = useState<TallerConfigState>(initialState);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<TallerConfigState>;
      setForm((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    apiRequest<Partial<TallerConfigState>>('/tenants/workshop-config', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setForm((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {
        // si falla API, mantenemos respaldo local
      });
  }, [token]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2200);
    return () => clearTimeout(t);
  }, [saved]);

  const setValue = <K extends keyof TallerConfigState>(key: K, value: TallerConfigState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    }
    try {
      if (token) {
        await apiRequest('/tenants/workshop-config', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
      }
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
            <div className="mx-auto max-w-[1500px] px-6 py-4">
              <h1 className="text-[50px] font-semibold tracking-tight text-[#2f3441]">Configuración de Taller</h1>
              <p className="mt-1 text-[14px] text-[#697182]">Principal › Taller › Configuración</p>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-6 py-5">
            <form onSubmit={onSave} className="rounded-3xl border border-gray-200 bg-[#f5f6f8] p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-1.5 text-[16px] text-[#3e4553]"
                >
                  ‹
                </button>
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`rounded-xl px-5 py-1.5 text-[12px] ${
                      tab === 'General'
                        ? 'border border-gray-300 bg-white text-[#2f3441]'
                        : 'text-[#505867] hover:bg-white/60'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
                <label className="rounded-2xl border border-gray-300 bg-white px-4 pb-2 pt-1 text-[11px] text-[#5d6575]">
                  <span className="px-1">Tipo de Taller</span>
                  <select
                    className="mt-1 w-full bg-transparent text-[16px] font-medium text-[#2f3441] outline-none"
                    value={form.tipoTaller}
                    onChange={(e) => setValue('tipoTaller', e.target.value)}
                  >
                    <option>Ninguno de la lista</option>
                    <option>Taller electrónico</option>
                    <option>Taller automotriz</option>
                    <option>Taller mixto</option>
                  </select>
                </label>

                <div className="rounded-2xl border border-gray-300 bg-white px-5 py-4 text-[14px] leading-snug text-[#2f3441]">
                  <strong>Atención:</strong> Los demás usuarios verán el efecto luego de cerrar sesión y volver a
                  acceder al sistema.
                </div>
              </div>

              <SectionTitle>CONFIGURACIÓN PARA LA CARGA DE ÓRDENES</SectionTitle>
              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
                <label className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-[11px] text-[#5d6575]">
                  N° Próxima orden
                  <input
                    className="mt-1 w-full bg-transparent text-[16px] text-[#2f3441] outline-none"
                    value={form.proximaOrden}
                    onChange={(e) => setValue('proximaOrden', e.target.value)}
                  />
                </label>

                <label className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-[11px] text-[#5d6575]">
                  Solicitar Referencia externa
                  <select
                    className="mt-1 w-full bg-transparent text-[16px] text-[#2f3441] outline-none"
                    value={form.referenciaExterna}
                    onChange={(e) => setValue('referenciaExterna', e.target.value as TallerConfigState['referenciaExterna'])}
                  >
                    <option value="no_visible">No visible</option>
                    <option value="visible">Visible</option>
                  </select>
                </label>

                <label className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-[11px] text-[#5d6575]">
                  Tipo de Equipo
                  <select
                    className="mt-1 w-full bg-transparent text-[16px] text-[#2f3441] outline-none"
                    value={form.tipoEquipo}
                    onChange={(e) => setValue('tipoEquipo', e.target.value as TallerConfigState['tipoEquipo'])}
                  >
                    <option value="visible">Visible</option>
                    <option value="no_visible">No visible</option>
                  </select>
                </label>

                <label className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-[11px] text-[#5d6575]">
                  Solicitar Firma
                  <select
                    className="mt-1 w-full bg-transparent text-[16px] text-[#2f3441] outline-none"
                    value={form.solicitarFirma}
                    onChange={(e) => setValue('solicitarFirma', e.target.value as TallerConfigState['solicitarFirma'])}
                  >
                    <option value="no">No</option>
                    <option value="si">Sí</option>
                  </select>
                </label>
              </div>

              <SectionTitle>ENCUESTA DE SATISFACCIÓN</SectionTitle>
              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
                <label className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-[11px] text-[#5d6575]">
                  Solicitar Encuesta
                  <select
                    className="mt-1 w-full bg-transparent text-[16px] text-[#2f3441] outline-none"
                    value={form.solicitarEncuesta}
                    onChange={(e) => setValue('solicitarEncuesta', e.target.value as TallerConfigState['solicitarEncuesta'])}
                  >
                    <option value="visible">Visible</option>
                    <option value="oculto">Ocultar</option>
                  </select>
                </label>

                <label className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-[11px] text-[#5d6575]">
                  Tipo de Encuesta
                  <select
                    className="mt-1 w-full bg-transparent text-[16px] text-[#2f3441] outline-none"
                    value={form.tipoEncuesta}
                    onChange={(e) => setValue('tipoEncuesta', e.target.value as TallerConfigState['tipoEncuesta'])}
                  >
                    <option value="estrellas">Estrellas</option>
                    <option value="nps">NPS</option>
                  </select>
                </label>

                <label className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-[11px] text-[#5d6575]">
                  Texto libre
                  <select
                    className="mt-1 w-full bg-transparent text-[16px] text-[#2f3441] outline-none"
                    value={form.textoLibre}
                    onChange={(e) => setValue('textoLibre', e.target.value as TallerConfigState['textoLibre'])}
                  >
                    <option value="permitido">Texto permitido</option>
                    <option value="no_permitido">No permitido</option>
                  </select>
                </label>
              </div>

              <SectionTitle>FORMULARIO ALTA DE NUEVO CLIENTE</SectionTitle>
              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                <label className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-[11px] text-[#5d6575]">
                  Correo electrónico
                  <select
                    className="mt-1 w-full bg-transparent text-[16px] text-[#2f3441] outline-none"
                    value={form.correoCliente}
                    onChange={(e) => setValue('correoCliente', e.target.value as TallerConfigState['correoCliente'])}
                  >
                    <option value="ocultar">Ocultar Campo</option>
                    <option value="visible">Visible</option>
                  </select>
                </label>

                <label className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-[11px] text-[#5d6575]">
                  Teléfono
                  <select
                    className="mt-1 w-full bg-transparent text-[16px] text-[#2f3441] outline-none"
                    value={form.telefonoCliente}
                    onChange={(e) => setValue('telefonoCliente', e.target.value as TallerConfigState['telefonoCliente'])}
                  >
                    <option value="ocultar">Ocultar Campo</option>
                    <option value="visible">Visible</option>
                  </select>
                </label>
              </div>

              <SectionTitle>PERMISOS DE ELIMINACIÓN</SectionTitle>
              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                <label className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-[11px] text-[#5d6575] xl:max-w-[520px]">
                  Eliminación de órdenes
                  <select
                    className="mt-1 w-full bg-transparent text-[16px] text-[#2f3441] outline-none"
                    value={form.eliminacionOrdenes}
                    onChange={(e) => setValue('eliminacionOrdenes', e.target.value as TallerConfigState['eliminacionOrdenes'])}
                  >
                    <option value="todos">Todos</option>
                    <option value="solo_admin">Solo administrador</option>
                    <option value="nadie">Nadie</option>
                  </select>
                </label>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                {error ? (
                  <div className="rounded-xl bg-red-100 px-4 py-2 text-sm font-medium text-red-700">
                    {error}
                  </div>
                ) : null}
                {saved ? (
                  <div className="rounded-xl bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
                    Configuración guardada
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#1f78c8] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1868ae]"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
