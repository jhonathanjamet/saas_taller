'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type NavItem = { label: string; href: string };
type IconName = 'agenda' | 'centro' | 'config' | 'cotizaciones' | 'productos' | 'servicios' | 'sistema';
type NavSection = { id: string; label: string; icon: IconName; items: NavItem[] };

const sections: NavSection[] = [
  { id: 'agenda', label: 'Agenda', icon: 'agenda', items: [{ label: 'Calendario', href: '/reportes' }] },
  {
    id: 'centro',
    label: 'Centro de Servicios',
    icon: 'centro',
    items: [
      { label: 'Órdenes de trabajo', href: '/ordenes' },
      { label: 'Equipos (Historial)', href: '/activos' },
      { label: 'Clientes (Historial)', href: '/clientes' },
      { label: 'Estadísticas', href: '/reportes' },
    ],
  },
  {
    id: 'config',
    label: 'Configuración de taller',
    icon: 'config',
    items: [
      { label: 'Plantilla de tareas', href: '/configuracion-taller/plantilla-tareas' },
      { label: 'Diagnósticos', href: '/configuracion-taller/diagnosticos' },
      { label: 'Marcas y modelos', href: '/configuracion-taller/marcas-modelos' },
      { label: 'Accesorios', href: '/configuracion-taller/accesorios' },
      { label: 'Áreas', href: '/configuracion-taller/areas' },
      { label: 'Tipos de Equipos', href: '/configuracion-taller/tipos-equipos' },
      { label: 'Widget para sitio web', href: '/configuracion-taller/widget-sitio-web' },
      { label: 'Configuración', href: '/configuracion-taller/configuracion' },
    ],
  },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: 'cotizaciones', items: [{ label: 'Mis cotizaciones', href: '/cotizaciones' }] },
  { id: 'productos', label: 'Productos', icon: 'productos', items: [{ label: 'Catálogo', href: '/productos' }] },
  { id: 'servicios', label: 'Servicios', icon: 'servicios', items: [{ label: 'Catálogo', href: '/servicios' }] },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: 'sistema',
    items: [
      { label: 'Usuarios', href: '/usuarios' },
      { label: 'WhatsApp / SMS', href: '/whatsapp-sms' },
      { label: 'Integraciones', href: '/integraciones' },
    ],
  },
];

const isPathActive = (pathname: string | null, href: string) => {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
};

function Icon({ name }: { name: IconName }) {
  const cls = 'h-6 w-6 text-[#3e4350]';
  switch (name) {
    case 'agenda':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
          <rect x="3" y="5" width="18" height="15" rx="2.5" />
          <path d="M3 10h18M8 3v4M16 3v4M7 14h5M7 17h8" />
        </svg>
      );
    case 'centro':
    case 'servicios':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
          <path d="m14.8 6.2 3 3m-6.3-.8 4-4a2 2 0 1 1 2.8 2.8l-4 4m-2.8-.1L6 16.5a2.2 2.2 0 0 1-3.1-3.1l5.4-5.3" />
        </svg>
      );
    case 'config':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
          <rect x="3" y="6" width="18" height="13" rx="2.5" />
          <path d="M8 6V4M16 6V4M3 11h18" />
        </svg>
      );
    case 'cotizaciones':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
          <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M15 3v5h5M10 12h4M10 16h4" />
        </svg>
      );
    case 'productos':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
          <path d="M3 8h18l-1.6 12H4.6L3 8Zm5-1a4 4 0 0 1 8 0" />
        </svg>
      );
    case 'sistema':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={cls}>
          <path d="M12 15.4A3.4 3.4 0 1 0 12 8.6a3.4 3.4 0 0 0 0 6.8Z" />
          <path d="m19 14.9.8 1.3-1.2 2.1-1.5-.2a7.1 7.1 0 0 1-1.2.7l-.5 1.4h-2.8l-.5-1.4c-.4-.2-.8-.4-1.2-.7l-1.5.2L4.2 16.2 5 14.9a8 8 0 0 1 0-1.8l-.8-1.3 1.2-2.1 1.5.2c.4-.3.8-.5 1.2-.7l.5-1.4h2.8l.5 1.4c.4.2.8.4 1.2.7l1.5-.2 1.2 2.1-.8 1.3a8 8 0 0 1 0 1.8Z" />
        </svg>
      );
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const activeSectionId = useMemo(() => {
    return sections.find((s) => s.items.some((i) => isPathActive(pathname, i.href)))?.id || 'centro';
  }, [pathname]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    agenda: false,
    centro: true,
    config: false,
    cotizaciones: false,
    productos: false,
    servicios: false,
    sistema: false,
  });

  useEffect(() => {
    setOpenSections((prev) => ({ ...prev, [activeSectionId]: true }));
  }, [activeSectionId]);

  return (
    <aside className={`relative hidden shrink-0 bg-[#ececee] p-4 transition-all duration-200 lg:flex ${collapsed ? 'lg:w-[90px]' : 'lg:w-[308px]'}`}>
      <div className="flex h-full w-full flex-col rounded-[30px] border border-gray-200 bg-[#f6f6f7] p-4 shadow-sm">
        <button
          className={`absolute z-20 h-11 w-11 rounded-full bg-[#1f78c8] text-[30px] leading-none text-white shadow-lg ${collapsed ? 'left-[70px] top-[136px]' : 'left-[282px] top-[136px]'}`}
          onClick={() => setCollapsed((v) => !v)}
          type="button"
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? '›' : '‹'}
        </button>

        {!collapsed ? (
          <div className="px-2 pt-1">
            <div className="text-[72px] font-black leading-[0.84] tracking-tight text-[#2f3541]">
              TH<span className="text-[#1f78c8]">+</span>
            </div>
            <div className="mt-3 flex justify-center">
              <button className="h-12 w-12 rounded-2xl border border-dashed border-[#9fb2c8] text-[34px] leading-none text-[#96aac0]">+</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pt-1">
            <div className="text-[34px] font-black text-[#2f3541]">TH<span className="text-[#1f78c8]">+</span></div>
          </div>
        )}

        <nav className="mt-5 flex-1 overflow-y-auto">
          {sections.map((section) => {
            const sectionActive = activeSectionId === section.id;
            const open = openSections[section.id];
            return (
              <div key={section.id} className={`relative mb-1 rounded-2xl ${sectionActive && !collapsed ? 'bg-[#d6e8f7]' : ''}`}>
                {sectionActive && !collapsed ? <span className="absolute left-0 top-2 h-10 w-[3px] rounded-r-full bg-[#2f3541]" /> : null}
                <button
                  className={`flex w-full items-center rounded-2xl py-2.5 text-[#3f4350] hover:bg-white/70 ${collapsed ? 'justify-center px-0' : 'justify-between px-3'}`}
                  onClick={() => {
                    if (collapsed) {
                      const first = section.items[0];
                      if (first) window.location.href = first.href;
                      return;
                    }
                    setOpenSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }));
                  }}
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <Icon name={section.icon} />
                    {!collapsed ? <span className="text-[15px] font-medium text-[#3f4350]">{section.label}</span> : null}
                  </span>
                  {!collapsed ? <span className="text-[22px] text-[#4b505d]">{open ? '⌃' : '⌄'}</span> : null}
                </button>

                {!collapsed && open ? (
                  <div className="pb-2 pl-9 pr-2">
                    <div className="ml-1 rounded-l-2xl border-l-2 border-[#8fc7ef] pl-3">
                      {section.items.map((item) => {
                        const active = isPathActive(pathname, item.href);
                        return (
                          <a
                            key={item.href}
                            href={item.href}
                            className={`block rounded-lg px-2.5 py-2 text-[15px] ${
                              active ? 'font-semibold text-[#212632]' : 'text-[#4c5160] hover:bg-[#edf4fb]'
                            }`}
                          >
                            {item.label}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className={`mt-3 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-1`}>
          <div className="h-9 w-[58px] rounded-full bg-[#d5d7dd]" />
          {!collapsed ? <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d5d7dd] text-sm">🔌</div> : null}
        </div>
      </div>
    </aside>
  );
}
