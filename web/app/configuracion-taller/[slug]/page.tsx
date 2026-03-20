type PageProps = {
  params: { slug: string };
};

const titles: Record<string, string> = {
  'plantilla-tareas': 'Plantilla de tareas',
  diagnosticos: 'Diagnósticos',
  'marcas-modelos': 'Marcas y modelos',
  accesorios: 'Accesorios',
  areas: 'Áreas',
  'tipos-equipos': 'Tipos de Equipos',
  'widget-sitio-web': 'Widget para sitio web',
  configuracion: 'Configuración',
};

export default function ConfiguracionTallerPage({ params }: PageProps) {
  const title = titles[params.slug] || 'Configuración de taller';

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#1e2430]">{title}</h1>
        <p className="mt-2 text-sm text-[#5b6472]">
          Módulo en preparación. En esta sección vamos a configurar este ítem paso a paso.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-[#b8d3eb] bg-[#f7fbff] p-5 text-sm text-[#35506d]">
        Próximo paso: definimos campos, tabla/listado y acciones de este módulo.
      </div>
    </section>
  );
}
