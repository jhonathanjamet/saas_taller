# 🔧 TallerHub — Plataforma SaaS para Gestión de Talleres y Servicios Técnicos

**Versión:** 1.0.0  
**Fecha:** 13 de marzo de 2026  
**Clasificación:** Documento de Arquitectura — Fase 1  
**Estado:** Aprobado para desarrollo

---

## Tabla de Contenidos

1. [Resumen Ejecutivo del Producto](#1-resumen-ejecutivo-del-producto)
2. [Nombre del Proyecto](#2-nombre-del-proyecto)
3. [Arquitectura Técnica Recomendada](#3-arquitectura-técnica-recomendada)
4. [Mapa Completo de Módulos](#4-mapa-completo-de-módulos)
5. [Modelo Entidad-Relación Completo](#5-modelo-entidad-relación-completo)
6. [Diseño de Roles y Permisos RBAC](#6-diseño-de-roles-y-permisos-rbac)
7. [Estrategia Multi-Tenant](#7-estrategia-multi-tenant)
8. [Flujos de Negocio Clave](#8-flujos-de-negocio-clave)
9. [Roadmap Detallado](#9-roadmap-detallado)
10. [Riesgos Técnicos y Mitigación](#10-riesgos-técnicos-y-mitigación)

---

## 1. Resumen Ejecutivo del Producto

### 1.1 Propuesta de Valor

**TallerHub** es una plataforma SaaS multi-tenant diseñada para digitalizar y optimizar la operación completa de talleres técnicos y servicios de reparación. Resuelve el problema central de miles de talleres que hoy gestionan su operación con hojas de cálculo, cuadernos o software genérico que no entiende su flujo de trabajo.

**Problema que resuelve:**

| Dolor del taller | Solución TallerHub |
|---|---|
| Pérdida de información de clientes y equipos | CRM especializado con historial técnico completo |
| Órdenes de trabajo en papel o WhatsApp | Sistema digital con trazabilidad completa y firma electrónica |
| Sin control de repuestos ni costos reales | Inventario integrado con costeo por orden y rentabilidad |
| Clientes preguntan constantemente el estado | Portal cliente con seguimiento en tiempo real |
| Técnicos en terreno sin herramientas | App móvil con modo offline, fotos, firma y GPS |
| Cotizaciones manuales sin seguimiento | Cotizaciones digitales con aprobación online y versionado |
| Sin datos para tomar decisiones | Dashboard con KPIs operativos y financieros |
| Mantenimientos preventivos olvidados | Programación automática con alertas y generación de OT |

### 1.2 Mercado Objetivo

**Segmentación primaria:**

- **Talleres mecánicos** (autos, motos, bicicletas, maquinaria)
- **Servicios técnicos** (computación, celulares, electrónica, electrodomésticos)
- **Talleres especializados** (audio profesional, iluminación, equipos industriales)
- **Empresas de mantenimiento** (con técnicos en terreno)

**Tamaño del mercado estimado (Latinoamérica):**

| Segmento | Talleres estimados | TAM mensual (USD) |
|---|---|---|
| Talleres mecánicos | 800.000+ | $24M - $48M |
| Servicios técnicos | 500.000+ | $10M - $25M |
| Empresas mantenimiento | 200.000+ | $8M - $20M |
| **Total** | **1.500.000+** | **$42M - $93M** |

**Perfil del usuario objetivo:**

- Dueño de taller o gerente de operaciones
- 1 a 50 empleados
- Uso intensivo diario (8-12 horas)
- Requiere acceso móvil para técnicos
- Sensible al precio pero dispuesto a pagar por valor demostrable

### 1.3 Diferenciadores Clave

| # | Diferenciador | Detalle |
|---|---|---|
| 1 | **Multi-vertical** | Un solo producto para mecánica, electrónica, computación, terreno |
| 2 | **App técnico nativa** | React Native con modo offline real y sincronización inteligente |
| 3 | **Portal cliente integrado** | Seguimiento, aprobación de cotizaciones y comunicación sin fricciones |
| 4 | **Mantenimiento preventivo** | Motor de programación automática por tiempo, km u horas de uso |
| 5 | **Rentabilidad por orden** | Costeo real con mano de obra + repuestos + margen visible |
| 6 | **Multi-sucursal nativo** | Gestión centralizada con permisos por sucursal desde el día uno |
| 7 | **Parametrizable sin código** | Estados, checklist, plantillas, campos y flujos configurables |
| 8 | **API-first** | Webhooks + API REST documentada para integraciones |

### 1.4 Modelo de Negocio SaaS

**Estructura de planes:**

| Plan | Usuarios | Sucursales | Módulos | Precio referencial (USD/mes) |
|---|---|---|---|---|
| **Starter** | 1-3 | 1 | MVP (Clientes, OT, Cotizaciones) | $19 - $29 |
| **Professional** | 4-10 | 1-3 | MVP + Inventario, Preventivos, Portal | $49 - $79 |
| **Business** | 11-25 | 1-5 | Todos los módulos | $99 - $149 |
| **Enterprise** | Ilimitados | Ilimitadas | Todos + API + White-label | Personalizado |

**Palancas de monetización:**

- Cobro por usuario activo
- Cobro por sucursal adicional
- Módulos premium (preventivos, terreno, portal cliente)
- Almacenamiento adicional (fotos/documentos)
- Integraciones premium (WhatsApp Business, facturación electrónica)
- Soporte prioritario
- Personalización de marca (white-label parcial)

**Métricas clave del negocio:**

- **MRR** (Monthly Recurring Revenue)
- **Churn rate** objetivo: < 5% mensual
- **LTV/CAC** objetivo: > 3x
- **Time to value**: < 30 minutos desde registro hasta primera OT

---

## 2. Nombre del Proyecto

### Nombre comercial: **TallerHub**

**Justificación:**

| Criterio | Evaluación |
|---|---|
| **Claridad** | "Taller" comunica inmediatamente el dominio; "Hub" connota centralización y plataforma |
| **Memorabilidad** | Dos sílabas, fácil de pronunciar en español e inglés |
| **Disponibilidad** | Nombre genérico con buenas posibilidades de dominio (.io, .app, .com variantes) |
| **Escalabilidad** | Suficientemente genérico para cubrir mecánica, electrónica, terreno |
| **SEO** | Contiene keyword primaria "taller" para posicionamiento orgánico en Latam |
| **Profesionalismo** | Suena moderno sin ser pretencioso; apropiado para venta B2B |

**Alternativas evaluadas:**

- *WorkShopOS* — demasiado anglicismo para Latam
- *TecniFlow* — limita percepción a técnicos
- *FixPro* — genérico, difícil de diferenciar
- *OrdenTec* — limitado a órdenes de trabajo

**Nombre interno del proyecto en código:** `tallerhub`

---

## 3. Arquitectura Técnica Recomendada

### 3.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENTES / USUARIOS                               │
├──────────┬───────────────┬────────────────┬─────────────────────────────────┤
│  Browser │  App Técnico  │ Portal Cliente │  Integraciones externas (API)   │
│ (Next.js)│(React Native) │   (Next.js)    │     Webhooks / REST             │
└────┬─────┴───────┬───────┴───────┬────────┴──────────────┬──────────────────┘
     │             │               │                       │
     └─────────────┴───────────────┴───────────────────────┘
                              │
                     ┌────────▼────────┐
                     │   CDN / Proxy   │
                     │   (CloudFlare)  │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  Load Balancer  │
                     │    (Nginx)      │
                     └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
      ┌───────▼──────┐┌──────▼───────┐┌──────▼───────┐
      │   API Node   ││  API Node    ││  API Node    │
      │   (NestJS)   ││  (NestJS)    ││  (NestJS)    │
      │  Instance 1  ││  Instance 2  ││  Instance N  │
      └──┬───┬───┬───┘└──┬───┬───┬───┘└──────────────┘
         │   │   │        │   │   │
    ┌────┘   │   └────┐   │   │   │
    │        │        │   │   │   │
┌───▼───┐┌───▼───┐┌───▼───▼───▼───▼──┐
│ Redis ││BullMQ ││   PostgreSQL      │
│ Cache ││ Queue ││   (Primary)       │
│       ││Workers││                   │
└───────┘└───┬───┘│  ┌─────────────┐  │
             │    │  │  Read       │  │
             │    │  │  Replica(s) │  │
             │    └──┴─────────────┴──┘
             │
      ┌──────▼──────┐
      │   Workers   │
      │  (BullMQ)   │
      │             │
      │ - PDFs      │
      │ - Emails    │
      │ - WhatsApp  │
      │ - Sync      │
      │ - Reportes  │
      └──────┬──────┘
             │
      ┌──────▼──────┐    ┌─────────────┐
      │     S3      │    │  Servicios  │
      │ Compatible  │    │  Externos   │
      │             │    │             │
      │ - Fotos     │    │ - SMTP      │
      │ - PDFs      │    │ - WhatsApp  │
      │ - Backups   │    │ - SMS       │
      │ - Adjuntos  │    │ - Maps      │
      └─────────────┘    └─────────────┘
```

### 3.2 Stack Completo Justificado

| Capa | Tecnología | Justificación |
|---|---|---|
| **Backend** | NestJS + TypeScript | Framework enterprise con DI, módulos, guards, interceptors. Estructura opinada que escala bien en equipos. TypeScript asegura type-safety end-to-end |
| **Frontend Web** | Next.js 14+ App Router + TypeScript | SSR/SSG para portal público, CSR para panel admin. Mismo lenguaje que backend. Ecosistema React maduro |
| **UI Components** | Tailwind CSS + shadcn/ui | Utility-first CSS para velocidad de desarrollo. shadcn/ui provee componentes accesibles y customizables sin vendor lock-in |
| **Mobile** | React Native + Expo | Comparte lógica de negocio con web. Expo simplifica builds y distribución. Acceso a cámara, GPS, almacenamiento offline nativo |
| **Base de datos** | PostgreSQL 16 | Madurez, JSON support, full-text search, partitioning, Row Level Security. Ideal para multi-tenant |
| **ORM** | Prisma | Type-safe queries, migraciones declarativas, excelente DX. Schema como fuente de verdad del modelo |
| **Cache** | Redis | Sub-millisecond reads para sesiones, permisos cacheados, contadores, rate limiting |
| **Colas** | BullMQ | Colas robustas sobre Redis: reintentos, prioridad, delay, cron jobs. Ideal para PDFs, emails, sync |
| **Almacenamiento** | S3 Compatible (MinIO dev / AWS S3 prod) | Estándar de la industria. Presigned URLs para upload directo. CDN compatible |
| **Auth** | JWT + Refresh Tokens | Stateless auth escalable. Refresh tokens rotativos en DB para revocación. Preparado para SSO futuro |
| **Containerización** | Docker + Docker Compose | Entornos reproducibles. Compose para desarrollo local. Orquestación en producción con ECS/K8s |
| **API Docs** | Swagger/OpenAPI via NestJS | Generación automática desde decoradores. Documentación siempre actualizada |

### 3.3 Patrones Arquitectónicos

#### Patrón principal: **Modular Monolith**

```
┌──────────────────────────────────────────────────┐
│                 NestJS Application                │
├──────────┬──────────┬──────────┬─────────────────┤
│  Auth    │ Clients  │  Work    │  Quotes         │
│  Module  │ Module   │  Orders  │  Module          │
│          │          │  Module  │                  │
├──────────┼──────────┼──────────┼─────────────────┤
│ Products │ Services │Inventory │  Suppliers       │
│ Module   │ Module   │ Module   │  Module          │
├──────────┼──────────┼──────────┼─────────────────┤
│ Schedule │Preventive│ Field    │  Notifications   │
│ Module   │ Module   │ Service  │  Module          │
│          │          │ Module   │                  │
├──────────┼──────────┼──────────┼─────────────────┤
│ Reports  │ Admin    │ Portal   │  Integrations    │
│ Module   │ Module   │ Module   │  Module          │
├──────────┴──────────┴──────────┴─────────────────┤
│              SHARED / CORE LAYER                  │
│  ┌──────────┬───────────┬──────────┬───────────┐ │
│  │ Tenant   │ Database  │ Auth     │ File      │ │
│  │ Context  │ Service   │ Guard    │ Service   │ │
│  ├──────────┼───────────┼──────────┼───────────┤ │
│  │ Audit    │ Cache     │ Queue    │ PDF       │ │
│  │ Service  │ Service   │ Service  │ Service   │ │
│  └──────────┴───────────┴──────────┴───────────┘ │
└──────────────────────────────────────────────────┘
```

**Justificación del Modular Monolith sobre microservicios:**

1. **Velocidad de desarrollo** — Un solo deploy, debugging simple, transacciones ACID locales
2. **Equipo pequeño** — Microservicios requieren overhead operacional no justificado inicialmente
3. **Preparado para extraer** — Cada módulo NestJS es autocontenido con su propio service layer; se puede extraer a microservicio cuando la escala lo justifique
4. **Comunicación interna** — Los módulos se comunican por inyección de dependencias, no por HTTP, eliminando latencia innecesaria

**Patrones complementarios:**

| Patrón | Uso |
|---|---|
| **Repository Pattern** | Prisma services actúan como repositorios con lógica de tenant filtering |
| **CQRS Light** | Separación de queries complejas (reportes) de commands (escrituras) |
| **Event-Driven** | Eventos internos (NestJS EventEmitter) para notificaciones, auditoría, sync |
| **Strategy Pattern** | Cálculo de preventivos (por tiempo, km, horas) como estrategias intercambiables |
| **Guard Chain** | Auth → Tenant → Role → Permission como pipeline de validación |
| **DTOs + Validation** | class-validator + class-transformer para input validation consistente |
| **Interceptors** | Logging, transformación de respuesta, tenant injection |
| **Middleware Pipeline** | Rate limiting → Auth → Tenant Resolution → Request Handler |

### 3.4 Estrategia de Escalabilidad

```
           Fase MVP                    Fase Growth                  Fase Scale
    ┌─────────────────┐         ┌─────────────────────┐     ┌──────────────────────┐
    │  1 API Server   │         │  2-4 API Servers     │     │  Auto-scaling group  │
    │  1 Worker       │   ──►   │  2+ Workers          │ ──► │  Worker fleet        │
    │  1 PostgreSQL   │         │  PG + Read Replica   │     │  PG Cluster          │
    │  1 Redis        │         │  Redis Cluster       │     │  Redis Sentinel      │
    │  Local S3/MinIO │         │  AWS S3 + CloudFront │     │  Multi-region S3     │
    │                 │         │  Connection Pooling  │     │  DB Partitioning     │
    └─────────────────┘         └─────────────────────┘     └──────────────────────┘
    
    ~100 tenants                 ~1.000 tenants               ~10.000+ tenants
    ~500 users                   ~5.000 users                  ~50.000+ users
```

**Decisiones de escalabilidad desde el día uno:**

1. **tenant_id en todas las tablas** — Permite sharding futuro por tenant
2. **Índices compuestos** `(tenant_id, ...)` — Queries eficientes desde el inicio
3. **Stateless API** — Escala horizontalmente sin sesiones de servidor
4. **Colas para trabajo pesado** — PDFs, emails, reportes nunca bloquean la API
5. **Connection pooling** (PgBouncer) — Preparado desde el inicio
6. **Paginación cursor-based** — Eficiente para datasets grandes
7. **Cache con invalidación por tenant** — Redis namespaces por tenant

---

## 4. Mapa Completo de Módulos

### 4.1 Vista General

```
┌─────────────────────────────────────────────────────────────┐
│                        TALLERHUB                             │
├─────────────────────────┬───────────────────────────────────┤
│     MÓDULOS CORE        │      MÓDULOS OPERACIÓN            │
│                         │                                   │
│  A. Clientes            │  E. Productos / Inventario        │
│  B. Activos / Equipos   │  F. Servicios / Mano de Obra      │
│  C. Órdenes de Trabajo  │  G. Proveedores y Compras         │
│  D. Cotizaciones        │  H. Mantenimiento Preventivo      │
│                         │                                   │
├─────────────────────────┼───────────────────────────────────┤
│  MÓDULOS PLANIFICACIÓN  │  MÓDULOS EXPERIENCIA              │
│                         │                                   │
│  I. Agenda              │  K. App Móvil Técnicos            │
│  J. Servicio a Domicilio│  L. Portal Cliente                │
│                         │  M. Notificaciones                │
├─────────────────────────┼───────────────────────────────────┤
│  MÓDULOS INTELIGENCIA   │  MÓDULOS PLATAFORMA               │
│                         │                                   │
│  N. Dashboard/Reportes  │  O. Administración                │
│                         │  P. Integraciones                 │
└─────────────────────────┴───────────────────────────────────┘
```

### 4.2 Detalle por Módulo

#### **A. Módulo Clientes**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | CRM especializado para talleres con historial técnico completo |
| **Entidades** | Customer, CustomerContact |
| **Funcionalidades clave** | CRUD completo · Persona o empresa · RUT/NIF/ID fiscal · Múltiples contactos · Teléfonos, email, dirección · Etiquetas · Observaciones · Estado activo/inactivo · Historial completo (OT, cotizaciones, facturación futura) · Búsqueda avanzada · Filtros persistentes · Exportación CSV/XLSX · Importación masiva · Timeline de actividad |
| **Dependencias** | Ninguna (módulo raíz) |
| **Fase** | MVP (Fase 1) |

#### **B. Módulo Activos / Equipos / Vehículos**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Registro y trazabilidad completa de todo equipo que ingresa al taller |
| **Entidades** | Asset, AssetType, AssetPhoto |
| **Funcionalidades clave** | Tipo de activo configurable · Marca, modelo, serie · Patente/matrícula · Año, color · Kilometraje/horas de uso/contador · Accesorios entregados · Estado visual al ingreso · Fotos (hasta 10) · Documentos adjuntos · Historial técnico completo · Historial de mantenimiento · Múltiples activos por cliente · Código QR único por activo |
| **Dependencias** | Clientes |
| **Fase** | MVP (Fase 1) |

#### **C. Módulo Órdenes de Trabajo**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Núcleo del sistema. Gestión completa del ciclo de vida de toda reparación o servicio |
| **Entidades** | WorkOrder, WorkOrderStatus, WorkOrderTask, WorkOrderChecklist, WorkOrderPhoto, WorkOrderComment, WorkOrderSignature, WorkOrderProduct, WorkOrderService |
| **Funcionalidades clave** | Número correlativo automático · Sucursal · Cliente + activo · Fechas (ingreso, promesa, cierre) · Prioridad · Estado configurable · Subtipo de orden · Canal de ingreso · Técnico asignado · Diagnóstico inicial y técnico · Notas internas y visibles al cliente · Checklist dinámicos · Tareas con tracking de horas · Fotos y archivos · Repuestos usados con descuento de stock · Servicios realizados · Costos internos vs precio cliente · Aprobación del cliente · Garantía · Firma de recepción y entrega · Cierre técnico y administrativo · Anulación con motivo · Reapertura controlada · Auditoría completa · Generación PDF (A4 + ticket térmico) · Duplicado · Plantillas de orden |
| **Estados configurables** | Ingresada → En revisión → Pendiente aprobación → Aprobada → Esperando repuesto → En reparación → Lista para entrega → Entregada → Cancelada → Garantía → Rechazada → (Personalizados) |
| **Dependencias** | Clientes, Activos, Productos, Servicios |
| **Fase** | MVP (Fase 1) |

#### **D. Módulo Cotizaciones / Presupuestos**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Cotizaciones profesionales con aprobación digital y conversión a OT |
| **Entidades** | Quote, QuoteItem, QuoteVersion |
| **Funcionalidades clave** | Crear desde cero o desde OT · Envío por email/WhatsApp/link · Aprobación o rechazo online · Fecha de vencimiento · Observaciones · Ítems visibles y ocultos para cliente · Descuentos por ítem y globales · Impuestos configurables · Subtotal, total, margen · Conversión bidireccional OT ↔ Cotización · Versionado completo · Historial de aprobaciones · Firma/aceptación digital · PDF profesional con branding |
| **Dependencias** | Clientes, Productos, Servicios, Órdenes (bidireccional) |
| **Fase** | MVP (Fase 1) |

#### **E. Módulo Productos / Repuestos / Inventario**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Gestión completa de inventario con kardex, multi-sucursal y reservas |
| **Entidades** | Product, ProductCategory, Inventory, InventoryMovement |
| **Funcionalidades clave** | Catálogo de productos · Categorías y subcategorías · SKU · Código de barras · Costo y precio de venta · Precio mayorista opcional · Stock por sucursal · Stock reservado (comprometido en OT) · Ubicación física · Alertas de stock mínimo · Movimientos de inventario con auditoría · Kardex completo · Ajuste manual con motivo y auditoría · Importación/exportación masiva · Lotes opcionales · Compatibilidad con modelos de activos · Kits de repuestos · Consumo automático desde OT |
| **Dependencias** | Ninguna (módulo raíz) |
| **Fase** | MVP (Fase 1) |

#### **F. Módulo Servicios / Mano de Obra**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Catálogo de servicios con precios, costos internos y asignación a OT |
| **Entidades** | Service, ServiceCategory |
| **Funcionalidades clave** | Catálogo de servicios · Categorías · Precio de venta · Costo interno (mano de obra) · Duración estimada · Impuestos aplicables · Plantillas de servicios comunes · Asignación directa a OT · Estadísticas de uso y frecuencia |
| **Dependencias** | Ninguna (módulo raíz) |
| **Fase** | MVP (Fase 1) |

#### **G. Módulo Proveedores y Compras**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Gestión de proveedores, órdenes de compra y recepción de mercadería |
| **Entidades** | Supplier, PurchaseOrder, PurchaseOrderItem |
| **Funcionalidades clave** | CRUD proveedores · Órdenes de compra · Estados de compra (borrador, enviada, parcialmente recibida, recibida, cancelada) · Recepción parcial o total · Ingreso automático a inventario · Costo real registrado · Costos adicionales (flete, etc.) · Documentos adjuntos · Comparación de proveedores · Historial de compras · Cuentas por pagar (futuro) |
| **Dependencias** | Productos/Inventario |
| **Fase** | V2 (Fase 2) |

#### **H. Módulo Mantenimiento Preventivo**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Programación automática de mantenimientos recurrentes con generación de OT |
| **Entidades** | PreventivePlan, PreventiveExecution |
| **Funcionalidades clave** | Programaciones recurrentes configurables · Frecuencia por días, semanas, meses · Frecuencia por kilómetros u horas de uso · Alertas previas configurables · Generación automática de OT al vencer · Tablero de preventivos (vencidos, próximos, en ejecución) · Historial por activo · Plantillas de preventivo por tipo de activo |
| **Dependencias** | Activos, Órdenes de Trabajo |
| **Fase** | V2 (Fase 2) |

#### **I. Módulo Agenda y Planificación**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Planificación visual de la carga de trabajo del taller |
| **Entidades** | ScheduleEvent (usa WorkOrder + campos adicionales) |
| **Funcionalidades clave** | Calendario diario/semanal/mensual · Vista por técnico · Vista por sucursal · Capacidad operativa visual · Carga de trabajo por técnico · Drag & drop para reasignación · Recordatorios · Vista de visitas a domicilio · Vista de promesas de entrega · Alertas de retraso · Bloqueos de horario |
| **Dependencias** | Órdenes de Trabajo, Usuarios |
| **Fase** | V2 (Fase 2) |

#### **J. Módulo Servicio a Domicilio / Terreno**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Gestión completa de servicios en terreno con geolocalización y cierre móvil |
| **Entidades** | FieldVisit (extensión de WorkOrder) |
| **Funcionalidades clave** | Orden tipo terreno · Dirección geolocalizada (lat/lng) · Múltiples direcciones por cliente · Mapa con ubicaciones del día · Planificación de rutas · Técnico asignado · Franja horaria · Checklist de visita · Fotos de evidencia · Repuestos usados en terreno · Firma del cliente en sitio · Cierre en terreno desde app · Generación de reporte de visita · Constatación de visita (timestamp + GPS) · Estados en tiempo real |
| **Dependencias** | Órdenes de Trabajo, App Móvil, Agenda |
| **Fase** | V3 (Fase 3) |

#### **K. Módulo App Móvil para Técnicos**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Herramienta móvil nativa para técnicos en taller y terreno |
| **Tecnología** | React Native + Expo |
| **Funcionalidades clave** | Login seguro · Lista de OT asignadas con filtros · Búsqueda · Escaneo QR de activos · Detalle de OT · Cambio de estado · Agregar notas y comentarios · Captura de fotos · Checklist interactivo · Registro de repuestos usados · Registro de servicios realizados · Firma del cliente en pantalla · Cierre de visita · Navegación GPS a dirección · Modo offline completo · Sincronización inteligente con resolución de conflictos |
| **Dependencias** | Órdenes de Trabajo, Activos |
| **Fase** | V2 (Fase 2) |

#### **L. Módulo Portal Cliente**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Autoservicio para clientes del taller con seguimiento y aprobaciones |
| **Entidades** | CustomerPortalAccess |
| **Funcionalidades clave** | Acceso por código único o login · Seguimiento de estado de OT en tiempo real · Visualización de cotizaciones · Aprobación/rechazo de cotizaciones online · Galería de fotos del equipo · Documentos descargables · Historial completo de servicios · Descarga de PDF · Comunicación básica con el taller · Notificaciones push/email · Branding personalizado del taller |
| **Dependencias** | Clientes, Órdenes, Cotizaciones, Notificaciones |
| **Fase** | V2 (Fase 2) |

#### **M. Módulo Notificaciones y Automatizaciones**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Sistema multicanal de notificaciones con disparadores automáticos |
| **Entidades** | NotificationTemplate, NotificationLog |
| **Funcionalidades clave** | Canales: Email, Push, SMS (proveedor externo), WhatsApp (API) · Plantillas configurables con variables dinámicas · Disparadores por evento (OT creada, cambio de estado, cotización pendiente, preventivo próximo, OT retrasada, OT lista) · Recordatorios automáticos · Cola de envío con reintentos · Log completo de notificaciones · Preferencias del destinatario |
| **Dependencias** | Todos los módulos (transversal) |
| **Fase** | V2 (Fase 2) |

#### **N. Módulo Dashboard y Reportes**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Inteligencia operativa y financiera para toma de decisiones |
| **Funcionalidades clave** | OT por estado · OT por sucursal · Productividad por técnico · Tiempos promedio por tipo de servicio · Ticket promedio · Ventas totales · Costos totales · Margen y rentabilidad por OT · Repuestos más usados · Clientes recurrentes · Preventivos vencidos · OT retrasadas · Ingresos proyectados · Filtros por rango de fecha, sucursal, técnico · Exportación PDF/XLSX · Gráficos interactivos |
| **Dependencias** | Todos los módulos (lectura transversal) |
| **Fase** | MVP básico en Fase 1, completo en V2 |

#### **O. Módulo Administración**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Configuración completa del tenant y la plataforma |
| **Entidades** | Tenant, Branch, User, Role, Permission, TenantConfig |
| **Funcionalidades clave** | Configuración general del tenant · Sucursales (CRUD) · Usuarios (CRUD con invitación) · Roles y permisos granulares · Branding (logo, colores, nombre) · Impuestos configurables · Moneda · Numeración de documentos · Estados configurables de OT · Áreas de trabajo · Plantillas de documentos · Parámetros del sistema · Auditoría de seguridad · Logs de acceso |
| **Dependencias** | Ninguna (módulo raíz de plataforma) |
| **Fase** | MVP (Fase 1) |

#### **P. Módulo Integraciones**

| Aspecto | Detalle |
|---|---|
| **Objetivo** | Conectividad con sistemas externos vía API y webhooks |
| **Entidades** | WebhookEndpoint, WebhookDelivery, ApiKey |
| **Funcionalidades clave** | Webhooks salientes configurables · API REST pública documentada · API Keys por tenant · WhatsApp Business API · Email transaccional (SMTP/SendGrid) · SMS (Twilio/proveedor) · Preparado para: facturación electrónica, contabilidad, pagos online, marketplace |
| **Dependencias** | Administración |
| **Fase** | V3 (Fase 3), API pública en V2 |

---

## 5. Modelo Entidad-Relación Completo

### 5.1 Estrategia de Modelado

**Convenciones:**

- Todas las tablas usan `snake_case`
- Todas las tablas incluyen: `id` (UUID), `tenant_id`, `created_at`, `updated_at`
- Soft delete donde corresponda: `deleted_at`
- Auditoría en entidades clave: `created_by`, `updated_by`
- Índice compuesto `(tenant_id, ...)` en toda tabla con acceso frecuente
- Enums en PostgreSQL para estados fijos; tablas de configuración para estados dinámicos

### 5.2 Diagrama de Relaciones (Textual)

```
Tenant (1) ─────── (N) Branch
Tenant (1) ─────── (N) User
Tenant (1) ─────── (N) Role
Tenant (1) ─────── (N) Customer
Tenant (1) ─────── (N) Product
Tenant (1) ─────── (N) Service
Tenant (1) ─────── (N) Supplier

User (N) ─────── (N) Branch           [vía UserBranch]
User (N) ─────── (1) Role
Role (N) ─────── (N) Permission       [vía RolePermission]

Customer (1) ─── (N) CustomerContact
Customer (1) ─── (N) Asset
Customer (1) ─── (N) WorkOrder
Customer (1) ─── (N) Quote
Customer (1) ─── (1) CustomerPortalAccess

Asset (1) ──────── (N) AssetPhoto
Asset (1) ──────── (N) WorkOrder
Asset (1) ──────── (N) PreventivePlan

WorkOrder (1) ─── (N) WorkOrderTask
WorkOrder (1) ─── (N) WorkOrderChecklist
WorkOrder (1) ─── (N) WorkOrderPhoto
WorkOrder (1) ─── (N) WorkOrderComment
WorkOrder (1) ─── (N) WorkOrderSignature
WorkOrder (1) ─── (N) WorkOrderProduct
WorkOrder (1) ─── (N) WorkOrderService
WorkOrder (N) ─── (1) WorkOrderStatus
WorkOrder (N) ─── (1) User [técnico]
WorkOrder (N) ─── (1) Branch

Quote (1) ──────── (N) QuoteItem
Quote (1) ──────── (N) QuoteVersion
Quote (N) ──────── (1) WorkOrder [opcional]
Quote (N) ──────── (1) Customer

Product (1) ────── (N) Inventory [por sucursal]
Product (1) ────── (N) InventoryMovement
Product (N) ────── (1) ProductCategory

Supplier (1) ───── (N) PurchaseOrder
PurchaseOrder (1)─ (N) PurchaseOrderItem
PurchaseOrderItem (N)─(1) Product

PreventivePlan (1)─(N) PreventiveExecution

NotificationTemplate (1)─(N) NotificationLog
```

### 5.3 Descripción Detallada de Entidades (38 tablas)

---

#### **PLATAFORMA Y MULTI-TENANCY**

##### Tabla: `tenant`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(255) | Nombre comercial del taller |
| `slug` | VARCHAR(100) | Identificador único URL-safe |
| `legal_name` | VARCHAR(255) | Razón social |
| `tax_id` | VARCHAR(50) | RUT/NIF/ID fiscal |
| `email` | VARCHAR(255) | Email principal |
| `phone` | VARCHAR(50) | Teléfono principal |
| `address` | TEXT | Dirección |
| `country` | VARCHAR(3) | Código ISO país |
| `currency` | VARCHAR(3) | Código ISO moneda (CLP, USD, etc.) |
| `timezone` | VARCHAR(50) | Zona horaria |
| `logo_url` | VARCHAR(500) | URL del logo en S3 |
| `primary_color` | VARCHAR(7) | Color principal HEX para branding |
| `plan_id` | UUID | FK → subscription_plan |
| `status` | ENUM | `active`, `suspended`, `trial`, `cancelled` |
| `trial_ends_at` | TIMESTAMP | Fin del periodo de prueba |
| `settings` | JSONB | Configuraciones generales (impuestos, numeración, etc.) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `UNIQUE(slug)`, `INDEX(status)`

##### Tabla: `subscription_plan`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(100) | Nombre del plan |
| `code` | VARCHAR(50) | Código interno (`starter`, `professional`, `business`, `enterprise`) |
| `max_users` | INT | Límite de usuarios (NULL = ilimitado) |
| `max_branches` | INT | Límite de sucursales |
| `enabled_modules` | JSONB | Lista de módulos habilitados |
| `max_storage_gb` | INT | Almacenamiento máximo |
| `price_monthly` | DECIMAL(10,2) | Precio mensual |
| `price_yearly` | DECIMAL(10,2) | Precio anual |
| `currency` | VARCHAR(3) | Moneda del precio |
| `is_active` | BOOLEAN | Plan disponible para contratación |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `UNIQUE(code)`

##### Tabla: `branch`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `name` | VARCHAR(255) | Nombre de la sucursal |
| `code` | VARCHAR(20) | Código corto (para numeración de documentos) |
| `address` | TEXT | Dirección |
| `phone` | VARCHAR(50) | Teléfono |
| `email` | VARCHAR(255) | Email |
| `latitude` | DECIMAL(10,8) | Coordenada |
| `longitude` | DECIMAL(11,8) | Coordenada |
| `is_main` | BOOLEAN | Sucursal principal |
| `is_active` | BOOLEAN | |
| `settings` | JSONB | Config específica de sucursal |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `UNIQUE(tenant_id, code)`, `INDEX(tenant_id, is_active)`

---

#### **USUARIOS Y PERMISOS**

##### Tabla: `user`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant (NULL para superadmin plataforma) |
| `email` | VARCHAR(255) | Email (login) |
| `password_hash` | VARCHAR(255) | Hash bcrypt |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `phone` | VARCHAR(50) | |
| `avatar_url` | VARCHAR(500) | |
| `role_id` | UUID | FK → role |
| `is_active` | BOOLEAN | |
| `last_login_at` | TIMESTAMP | |
| `email_verified_at` | TIMESTAMP | |
| `refresh_token_hash` | VARCHAR(255) | Hash del refresh token activo |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | Soft delete |

**Índices:** `UNIQUE(email)`, `INDEX(tenant_id, is_active)`, `INDEX(tenant_id, role_id)`

##### Tabla: `role`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant (NULL para roles de plataforma) |
| `name` | VARCHAR(100) | Nombre visible |
| `code` | VARCHAR(50) | Código interno (`owner`, `admin`, `technician`, etc.) |
| `description` | TEXT | |
| `is_system` | BOOLEAN | Rol del sistema (no editable/eliminable) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `UNIQUE(tenant_id, code)`

##### Tabla: `permission`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `module` | VARCHAR(50) | Módulo (`clients`, `work_orders`, `quotes`, etc.) |
| `action` | VARCHAR(50) | Acción (`create`, `read`, `update`, `delete`, `export`, `configure`) |
| `description` | VARCHAR(255) | Descripción legible |
| `created_at` | TIMESTAMP | |

**Índices:** `UNIQUE(module, action)`

##### Tabla: `role_permission`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `role_id` | UUID | FK → role |
| `permission_id` | UUID | FK → permission |
| `conditions` | JSONB | Condiciones adicionales (ej: `{"own_only": true, "cost_visible": false}`) |

**Índices:** `UNIQUE(role_id, permission_id)`

##### Tabla: `user_branch`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → user |
| `branch_id` | UUID | FK → branch |
| `is_default` | BOOLEAN | Sucursal por defecto del usuario |

**Índices:** `UNIQUE(user_id, branch_id)`

---

#### **CLIENTES**

##### Tabla: `customer`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `type` | ENUM | `person`, `company` |
| `first_name` | VARCHAR(100) | Nombre (persona) o nombre comercial |
| `last_name` | VARCHAR(100) | Apellido (persona) |
| `legal_name` | VARCHAR(255) | Razón social (empresa) |
| `tax_id` | VARCHAR(50) | RUT/NIF/ID fiscal |
| `email` | VARCHAR(255) | Email principal |
| `phone` | VARCHAR(50) | Teléfono principal |
| `secondary_phone` | VARCHAR(50) | Teléfono secundario |
| `address` | TEXT | Dirección |
| `city` | VARCHAR(100) | Ciudad |
| `state` | VARCHAR(100) | Región/Estado |
| `zip_code` | VARCHAR(20) | Código postal |
| `country` | VARCHAR(3) | |
| `tags` | JSONB | Array de etiquetas |
| `notes` | TEXT | Observaciones internas |
| `source` | VARCHAR(50) | Canal de captación |
| `is_active` | BOOLEAN | |
| `created_by` | UUID | FK → user |
| `updated_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | Soft delete |

**Índices:** `INDEX(tenant_id, is_active)`, `INDEX(tenant_id, tax_id)`, `INDEX(tenant_id, email)`, `GIN(tenant_id, tags)`, Full-text: `INDEX(tenant_id, first_name, last_name, legal_name)`

##### Tabla: `customer_contact`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `customer_id` | UUID | FK → customer |
| `name` | VARCHAR(200) | Nombre del contacto |
| `role` | VARCHAR(100) | Cargo / relación |
| `email` | VARCHAR(255) | |
| `phone` | VARCHAR(50) | |
| `is_primary` | BOOLEAN | Contacto principal |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, customer_id)`

##### Tabla: `customer_portal_access`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `customer_id` | UUID | FK → customer |
| `access_code` | VARCHAR(20) | Código de acceso único |
| `password_hash` | VARCHAR(255) | Hash si usa login con contraseña |
| `is_active` | BOOLEAN | |
| `last_access_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `UNIQUE(tenant_id, access_code)`, `INDEX(tenant_id, customer_id)`

---

#### **ACTIVOS / EQUIPOS**

##### Tabla: `asset_type`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `name` | VARCHAR(100) | Nombre del tipo (Automóvil, Notebook, Consola, etc.) |
| `icon` | VARCHAR(50) | Ícono identificador |
| `fields_schema` | JSONB | Campos personalizados para este tipo |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, is_active)`

##### Tabla: `asset`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `customer_id` | UUID | FK → customer |
| `asset_type_id` | UUID | FK → asset_type |
| `brand` | VARCHAR(100) | Marca |
| `model` | VARCHAR(100) | Modelo |
| `serial_number` | VARCHAR(100) | Número de serie |
| `license_plate` | VARCHAR(20) | Patente/matrícula |
| `year` | INT | Año |
| `color` | VARCHAR(50) | Color |
| `mileage` | DECIMAL(12,2) | Kilometraje / horas de uso / contador |
| `mileage_unit` | ENUM | `km`, `hours`, `cycles`, `none` |
| `accessories` | TEXT | Accesorios entregados |
| `visual_condition` | TEXT | Estado visual al ingreso |
| `qr_code` | VARCHAR(100) | Código QR único |
| `custom_fields` | JSONB | Campos adicionales según asset_type |
| `notes` | TEXT | |
| `is_active` | BOOLEAN | |
| `created_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | Soft delete |

**Índices:** `UNIQUE(tenant_id, qr_code)`, `INDEX(tenant_id, customer_id)`, `INDEX(tenant_id, serial_number)`, `INDEX(tenant_id, license_plate)`

##### Tabla: `asset_photo`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `asset_id` | UUID | FK → asset |
| `file_url` | VARCHAR(500) | URL en S3 |
| `thumbnail_url` | VARCHAR(500) | Thumbnail |
| `description` | VARCHAR(255) | |
| `sort_order` | INT | Orden de visualización |
| `created_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, asset_id)`

---

#### **ÓRDENES DE TRABAJO**

##### Tabla: `work_order_status`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `name` | VARCHAR(100) | Nombre del estado |
| `code` | VARCHAR(50) | Código interno |
| `color` | VARCHAR(7) | Color HEX |
| `sort_order` | INT | Orden en el flujo |
| `is_initial` | BOOLEAN | Estado inicial por defecto |
| `is_final` | BOOLEAN | Estado de cierre |
| `is_system` | BOOLEAN | No eliminable |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, sort_order)`, `UNIQUE(tenant_id, code)`

##### Tabla: `work_order`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `branch_id` | UUID | FK → branch |
| `order_number` | VARCHAR(30) | Número correlativo (ej: `SUC01-000123`) |
| `customer_id` | UUID | FK → customer |
| `asset_id` | UUID | FK → asset (nullable) |
| `status_id` | UUID | FK → work_order_status |
| `priority` | ENUM | `low`, `medium`, `high`, `urgent` |
| `order_type` | VARCHAR(50) | Tipo de orden (reparación, mantenimiento, diagnóstico, etc.) |
| `channel` | VARCHAR(50) | Canal de ingreso (presencial, teléfono, web, WhatsApp) |
| `assigned_to` | UUID | FK → user (técnico asignado) |
| `received_by` | UUID | FK → user (recepcionista) |
| `initial_diagnosis` | TEXT | Diagnóstico inicial / motivo ingreso |
| `technical_diagnosis` | TEXT | Diagnóstico técnico |
| `internal_notes` | TEXT | Notas internas (no visibles al cliente) |
| `client_notes` | TEXT | Notas visibles al cliente |
| `warranty_terms` | TEXT | Términos de garantía |
| `warranty_until` | DATE | Garantía válida hasta |
| `received_at` | TIMESTAMP | Fecha/hora de ingreso |
| `promised_at` | TIMESTAMP | Fecha/hora promesa de entrega |
| `started_at` | TIMESTAMP | Inicio de trabajo |
| `completed_at` | TIMESTAMP | Fin de trabajo |
| `delivered_at` | TIMESTAMP | Entrega al cliente |
| `cancelled_at` | TIMESTAMP | Cancelación |
| `cancellation_reason` | TEXT | Motivo de cancelación |
| `subtotal_products` | DECIMAL(12,2) | Subtotal repuestos |
| `subtotal_services` | DECIMAL(12,2) | Subtotal mano de obra |
| `discount_amount` | DECIMAL(12,2) | Descuento total |
| `tax_amount` | DECIMAL(12,2) | Impuestos |
| `total_amount` | DECIMAL(12,2) | Total al cliente |
| `internal_cost` | DECIMAL(12,2) | Costo interno total |
| `profit_margin` | DECIMAL(5,2) | Margen de ganancia (%) |
| `quote_id` | UUID | FK → quote (cotización asociada, nullable) |
| `parent_order_id` | UUID | FK → work_order (para garantías / reaperturas) |
| `is_field_service` | BOOLEAN | Es servicio a domicilio |
| `field_address` | TEXT | Dirección del servicio (si es a domicilio) |
| `field_latitude` | DECIMAL(10,8) | |
| `field_longitude` | DECIMAL(11,8) | |
| `field_scheduled_at` | TIMESTAMP | Hora programada para visita |
| `created_by` | UUID | FK → user |
| `updated_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | Soft delete |

**Índices:** `UNIQUE(tenant_id, order_number)`, `INDEX(tenant_id, branch_id, status_id)`, `INDEX(tenant_id, customer_id)`, `INDEX(tenant_id, asset_id)`, `INDEX(tenant_id, assigned_to)`, `INDEX(tenant_id, created_at)`, `INDEX(tenant_id, promised_at)`, `INDEX(tenant_id, is_field_service)`

##### Tabla: `work_order_task`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `work_order_id` | UUID | FK → work_order |
| `title` | VARCHAR(255) | Descripción de la tarea |
| `assigned_to` | UUID | FK → user |
| `estimated_hours` | DECIMAL(5,2) | Horas estimadas |
| `actual_hours` | DECIMAL(5,2) | Horas reales |
| `started_at` | TIMESTAMP | |
| `completed_at` | TIMESTAMP | |
| `status` | ENUM | `pending`, `in_progress`, `completed`, `skipped` |
| `sort_order` | INT | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, work_order_id)`

##### Tabla: `work_order_checklist`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `work_order_id` | UUID | FK → work_order |
| `item_text` | VARCHAR(255) | Texto del ítem |
| `is_checked` | BOOLEAN | |
| `checked_by` | UUID | FK → user |
| `checked_at` | TIMESTAMP | |
| `sort_order` | INT | |
| `created_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, work_order_id)`

##### Tabla: `work_order_photo`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `work_order_id` | UUID | FK → work_order |
| `file_url` | VARCHAR(500) | URL en S3 |
| `thumbnail_url` | VARCHAR(500) | |
| `description` | VARCHAR(255) | |
| `phase` | ENUM | `reception`, `diagnosis`, `repair`, `delivery` |
| `is_visible_to_client` | BOOLEAN | Visible en portal cliente |
| `sort_order` | INT | |
| `uploaded_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, work_order_id)`, `INDEX(tenant_id, work_order_id, is_visible_to_client)`

##### Tabla: `work_order_comment`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `work_order_id` | UUID | FK → work_order |
| `user_id` | UUID | FK → user |
| `content` | TEXT | Contenido del comentario |
| `is_internal` | BOOLEAN | Solo visible para el equipo |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, work_order_id, created_at)`

##### Tabla: `work_order_signature`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `work_order_id` | UUID | FK → work_order |
| `type` | ENUM | `reception`, `delivery`, `approval` |
| `signer_name` | VARCHAR(200) | Nombre del firmante |
| `signer_id_number` | VARCHAR(50) | RUT/DNI del firmante |
| `signature_url` | VARCHAR(500) | Imagen de firma en S3 |
| `signed_at` | TIMESTAMP | |
| `ip_address` | VARCHAR(45) | IP del firmante |
| `device_info` | VARCHAR(255) | Info del dispositivo |
| `created_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, work_order_id)`

##### Tabla: `work_order_product`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `work_order_id` | UUID | FK → work_order |
| `product_id` | UUID | FK → product |
| `quantity` | DECIMAL(10,2) | Cantidad utilizada |
| `unit_cost` | DECIMAL(12,2) | Costo unitario al momento del uso |
| `unit_price` | DECIMAL(12,2) | Precio cobrado al cliente |
| `discount_percent` | DECIMAL(5,2) | Descuento (%) |
| `total_cost` | DECIMAL(12,2) | Costo total |
| `total_price` | DECIMAL(12,2) | Precio total al cliente |
| `notes` | TEXT | |
| `added_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, work_order_id)`, `INDEX(tenant_id, product_id)`

##### Tabla: `work_order_service`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `work_order_id` | UUID | FK → work_order |
| `service_id` | UUID | FK → service |
| `quantity` | DECIMAL(10,2) | Cantidad (horas u occurrencias) |
| `unit_cost` | DECIMAL(12,2) | Costo interno |
| `unit_price` | DECIMAL(12,2) | Precio cobrado |
| `discount_percent` | DECIMAL(5,2) | |
| `total_cost` | DECIMAL(12,2) | |
| `total_price` | DECIMAL(12,2) | |
| `technician_id` | UUID | FK → user |
| `notes` | TEXT | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, work_order_id)`, `INDEX(tenant_id, service_id)`

---

#### **COTIZACIONES**

##### Tabla: `quote`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `branch_id` | UUID | FK → branch |
| `quote_number` | VARCHAR(30) | Número correlativo |
| `customer_id` | UUID | FK → customer |
| `work_order_id` | UUID | FK → work_order (nullable) |
| `version` | INT | Versión actual (incrementa con cada edición mayor) |
| `status` | ENUM | `draft`, `sent`, `viewed`, `approved`, `rejected`, `expired`, `converted` |
| `title` | VARCHAR(255) | Título de la cotización |
| `description` | TEXT | Descripción general |
| `notes` | TEXT | Observaciones |
| `internal_notes` | TEXT | Notas internas |
| `subtotal` | DECIMAL(12,2) | |
| `discount_amount` | DECIMAL(12,2) | Descuento global |
| `tax_amount` | DECIMAL(12,2) | |
| `total` | DECIMAL(12,2) | |
| `internal_cost` | DECIMAL(12,2) | Costo interno total |
| `margin_percent` | DECIMAL(5,2) | Margen (%) |
| `valid_until` | DATE | Fecha de vencimiento |
| `approved_at` | TIMESTAMP | |
| `approved_by` | VARCHAR(200) | Nombre de quien aprobó |
| `rejected_at` | TIMESTAMP | |
| `rejection_reason` | TEXT | |
| `sent_at` | TIMESTAMP | Último envío |
| `sent_via` | VARCHAR(50) | Canal de envío (email, whatsapp, link) |
| `access_token` | VARCHAR(100) | Token para acceso público sin login |
| `created_by` | UUID | FK → user |
| `updated_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | |

**Índices:** `UNIQUE(tenant_id, quote_number)`, `INDEX(tenant_id, customer_id)`, `INDEX(tenant_id, status)`, `UNIQUE(access_token)`

##### Tabla: `quote_item`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `quote_id` | UUID | FK → quote |
| `item_type` | ENUM | `product`, `service`, `custom` |
| `product_id` | UUID | FK → product (nullable) |
| `service_id` | UUID | FK → service (nullable) |
| `description` | VARCHAR(500) | Descripción del ítem |
| `quantity` | DECIMAL(10,2) | |
| `unit_cost` | DECIMAL(12,2) | Costo interno |
| `unit_price` | DECIMAL(12,2) | Precio al cliente |
| `discount_percent` | DECIMAL(5,2) | |
| `tax_rate` | DECIMAL(5,2) | Tasa de impuesto |
| `total` | DECIMAL(12,2) | |
| `is_visible_to_client` | BOOLEAN | Visible en PDF/portal |
| `sort_order` | INT | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, quote_id)`

##### Tabla: `quote_version`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `quote_id` | UUID | FK → quote |
| `version_number` | INT | |
| `snapshot` | JSONB | Snapshot completo de la cotización en ese momento |
| `changed_by` | UUID | FK → user |
| `change_reason` | TEXT | |
| `created_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, quote_id, version_number)`

---

#### **PRODUCTOS E INVENTARIO**

##### Tabla: `product_category`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `parent_id` | UUID | FK → product_category (nullable, para subcategorías) |
| `name` | VARCHAR(200) | |
| `slug` | VARCHAR(200) | |
| `sort_order` | INT | |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, parent_id)`, `UNIQUE(tenant_id, slug)`

##### Tabla: `product`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `category_id` | UUID | FK → product_category (nullable) |
| `sku` | VARCHAR(50) | SKU interno |
| `barcode` | VARCHAR(50) | Código de barras |
| `name` | VARCHAR(255) | Nombre del producto |
| `description` | TEXT | |
| `unit` | VARCHAR(20) | Unidad de medida (unidad, litro, metro, etc.) |
| `cost` | DECIMAL(12,2) | Costo de compra |
| `price` | DECIMAL(12,2) | Precio de venta |
| `wholesale_price` | DECIMAL(12,2) | Precio mayorista (nullable) |
| `tax_rate` | DECIMAL(5,2) | Tasa de impuesto |
| `min_stock` | DECIMAL(10,2) | Stock mínimo para alerta |
| `location` | VARCHAR(100) | Ubicación física (bodega, estante, etc.) |
| `image_url` | VARCHAR(500) | |
| `compatible_models` | JSONB | Modelos de activos compatibles |
| `is_kit` | BOOLEAN | Es un kit de repuestos |
| `kit_items` | JSONB | Composición del kit [{product_id, quantity}] |
| `is_active` | BOOLEAN | |
| `created_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | Soft delete |

**Índices:** `UNIQUE(tenant_id, sku)`, `INDEX(tenant_id, barcode)`, `INDEX(tenant_id, category_id)`, `INDEX(tenant_id, is_active)`, Full-text: `INDEX(tenant_id, name)`

##### Tabla: `inventory`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `product_id` | UUID | FK → product |
| `branch_id` | UUID | FK → branch |
| `quantity` | DECIMAL(10,2) | Stock disponible |
| `reserved_quantity` | DECIMAL(10,2) | Stock reservado para OT |
| `updated_at` | TIMESTAMP | |

**Índices:** `UNIQUE(tenant_id, product_id, branch_id)`, `INDEX(tenant_id, branch_id)`

##### Tabla: `inventory_movement`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `product_id` | UUID | FK → product |
| `branch_id` | UUID | FK → branch |
| `type` | ENUM | `purchase_in`, `work_order_out`, `adjustment`, `transfer_in`, `transfer_out`, `return`, `initial` |
| `quantity` | DECIMAL(10,2) | Cantidad (positiva o negativa) |
| `previous_stock` | DECIMAL(10,2) | Stock antes del movimiento |
| `new_stock` | DECIMAL(10,2) | Stock después del movimiento |
| `unit_cost` | DECIMAL(12,2) | Costo unitario al momento |
| `reference_type` | VARCHAR(50) | Tipo de referencia (work_order, purchase_order, etc.) |
| `reference_id` | UUID | ID de la referencia |
| `reason` | TEXT | Motivo (para ajustes manuales) |
| `created_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, product_id, created_at)`, `INDEX(tenant_id, branch_id, created_at)`, `INDEX(tenant_id, reference_type, reference_id)`

---

#### **SERVICIOS**

##### Tabla: `service_category`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `name` | VARCHAR(200) | |
| `sort_order` | INT | |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, is_active)`

##### Tabla: `service`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `category_id` | UUID | FK → service_category (nullable) |
| `name` | VARCHAR(255) | |
| `description` | TEXT | |
| `cost` | DECIMAL(12,2) | Costo interno (mano de obra) |
| `price` | DECIMAL(12,2) | Precio de venta |
| `estimated_duration_minutes` | INT | Duración estimada |
| `tax_rate` | DECIMAL(5,2) | |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, is_active)`, `INDEX(tenant_id, category_id)`

---

#### **PROVEEDORES Y COMPRAS**

##### Tabla: `supplier`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `name` | VARCHAR(255) | |
| `legal_name` | VARCHAR(255) | |
| `tax_id` | VARCHAR(50) | |
| `contact_name` | VARCHAR(200) | |
| `email` | VARCHAR(255) | |
| `phone` | VARCHAR(50) | |
| `address` | TEXT | |
| `website` | VARCHAR(255) | |
| `notes` | TEXT | |
| `payment_terms` | VARCHAR(100) | Condiciones de pago |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |
| `deleted_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, is_active)`

##### Tabla: `purchase_order`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `branch_id` | UUID | FK → branch |
| `order_number` | VARCHAR(30) | Número correlativo |
| `supplier_id` | UUID | FK → supplier |
| `status` | ENUM | `draft`, `sent`, `partially_received`, `received`, `cancelled` |
| `notes` | TEXT | |
| `subtotal` | DECIMAL(12,2) | |
| `additional_costs` | DECIMAL(12,2) | Flete, internación, etc. |
| `tax_amount` | DECIMAL(12,2) | |
| `total` | DECIMAL(12,2) | |
| `expected_at` | DATE | Fecha esperada de recepción |
| `received_at` | TIMESTAMP | Fecha real de recepción completa |
| `created_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `UNIQUE(tenant_id, order_number)`, `INDEX(tenant_id, supplier_id)`, `INDEX(tenant_id, status)`

##### Tabla: `purchase_order_item`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `purchase_order_id` | UUID | FK → purchase_order |
| `product_id` | UUID | FK → product |
| `quantity_ordered` | DECIMAL(10,2) | Cantidad solicitada |
| `quantity_received` | DECIMAL(10,2) | Cantidad recibida (puede ser parcial) |
| `unit_cost` | DECIMAL(12,2) | Costo unitario |
| `total_cost` | DECIMAL(12,2) | Costo total |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, purchase_order_id)`, `INDEX(tenant_id, product_id)`

---

#### **MANTENIMIENTO PREVENTIVO**

##### Tabla: `preventive_plan`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `asset_id` | UUID | FK → asset |
| `name` | VARCHAR(255) | Nombre del plan |
| `description` | TEXT | |
| `frequency_type` | ENUM | `days`, `weeks`, `months`, `kilometers`, `hours` |
| `frequency_value` | INT | Cada cuántas unidades |
| `alert_before_value` | INT | Alertar X unidades antes |
| `template_tasks` | JSONB | Tareas estándar del preventivo |
| `template_products` | JSONB | Repuestos estándar |
| `template_services` | JSONB | Servicios estándar |
| `last_executed_at` | TIMESTAMP | Última ejecución |
| `next_due_at` | TIMESTAMP | Próxima ejecución calculada |
| `next_due_mileage` | DECIMAL(12,2) | Próximo km/horas de ejecución |
| `is_active` | BOOLEAN | |
| `created_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, asset_id)`, `INDEX(tenant_id, next_due_at)`, `INDEX(tenant_id, is_active)`

##### Tabla: `preventive_execution`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `preventive_plan_id` | UUID | FK → preventive_plan |
| `work_order_id` | UUID | FK → work_order (OT generada) |
| `scheduled_at` | TIMESTAMP | Fecha programada |
| `executed_at` | TIMESTAMP | Fecha real de ejecución |
| `status` | ENUM | `scheduled`, `overdue`, `in_progress`, `completed`, `skipped` |
| `notes` | TEXT | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, preventive_plan_id)`, `INDEX(tenant_id, status, scheduled_at)`

---

#### **NOTIFICACIONES**

##### Tabla: `notification_template`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant (NULL para templates de plataforma) |
| `event` | VARCHAR(100) | Evento disparador (`work_order.created`, `work_order.status_changed`, `quote.sent`, etc.) |
| `channel` | ENUM | `email`, `push`, `sms`, `whatsapp` |
| `subject` | VARCHAR(255) | Asunto (email) |
| `body` | TEXT | Cuerpo con variables `{{customer.name}}`, `{{order.number}}`, etc. |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, event, channel)`

##### Tabla: `notification_log`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `template_id` | UUID | FK → notification_template (nullable) |
| `channel` | ENUM | `email`, `push`, `sms`, `whatsapp` |
| `recipient` | VARCHAR(255) | Email, teléfono, etc. |
| `subject` | VARCHAR(255) | |
| `body` | TEXT | Contenido renderizado |
| `status` | ENUM | `queued`, `sent`, `delivered`, `failed`, `bounced` |
| `error_message` | TEXT | |
| `reference_type` | VARCHAR(50) | |
| `reference_id` | UUID | |
| `sent_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, created_at)`, `INDEX(tenant_id, reference_type, reference_id)`, `INDEX(tenant_id, status)`

---

#### **AUDITORÍA Y ARCHIVOS**

##### Tabla: `audit_log`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `user_id` | UUID | FK → user |
| `action` | VARCHAR(50) | `create`, `update`, `delete`, `login`, `export`, `approve`, etc. |
| `entity_type` | VARCHAR(50) | Tipo de entidad afectada |
| `entity_id` | UUID | ID de la entidad |
| `changes` | JSONB | `{field: {old: ..., new: ...}}` |
| `ip_address` | VARCHAR(45) | |
| `user_agent` | VARCHAR(500) | |
| `created_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, entity_type, entity_id)`, `INDEX(tenant_id, user_id, created_at)`, `INDEX(tenant_id, action, created_at)`

> **Nota:** Esta tabla se beneficia de partitioning por `created_at` (mensual) cuando crece.

##### Tabla: `file_attachment`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `entity_type` | VARCHAR(50) | Tipo de entidad (`work_order`, `asset`, `purchase_order`, etc.) |
| `entity_id` | UUID | ID de la entidad |
| `file_name` | VARCHAR(255) | Nombre original |
| `file_url` | VARCHAR(500) | URL en S3 |
| `file_size` | INT | Tamaño en bytes |
| `mime_type` | VARCHAR(100) | |
| `uploaded_by` | UUID | FK → user |
| `created_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, entity_type, entity_id)`

---

#### **INTEGRACIONES**

##### Tabla: `webhook_endpoint`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `url` | VARCHAR(500) | URL destino |
| `events` | JSONB | Lista de eventos suscritos |
| `secret` | VARCHAR(255) | Secret para firma HMAC |
| `is_active` | BOOLEAN | |
| `last_triggered_at` | TIMESTAMP | |
| `failure_count` | INT | Contador de fallos consecutivos |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, is_active)`

##### Tabla: `webhook_delivery`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `webhook_id` | UUID | FK → webhook_endpoint |
| `event` | VARCHAR(100) | |
| `payload` | JSONB | Payload enviado |
| `response_status` | INT | HTTP status code |
| `response_body` | TEXT | |
| `duration_ms` | INT | Tiempo de respuesta |
| `status` | ENUM | `pending`, `success`, `failed` |
| `attempts` | INT | |
| `next_retry_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, webhook_id, created_at)`, `INDEX(tenant_id, status)`

---

#### **SINCRONIZACIÓN MÓVIL**

##### Tabla: `mobile_sync_log`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenant |
| `user_id` | UUID | FK → user |
| `device_id` | VARCHAR(255) | Identificador del dispositivo |
| `sync_type` | ENUM | `full`, `incremental` |
| `direction` | ENUM | `upload`, `download` |
| `entities_synced` | JSONB | `{work_orders: 5, photos: 3, ...}` |
| `conflicts` | JSONB | Conflictos detectados y resolución |
| `status` | ENUM | `started`, `completed`, `failed` |
| `started_at` | TIMESTAMP | |
| `completed_at` | TIMESTAMP | |
| `error_message` | TEXT | |
| `created_at` | TIMESTAMP | |

**Índices:** `INDEX(tenant_id, user_id, created_at)`

---

### 5.4 Resumen del Modelo

| Grupo | Tablas | Cantidad |
|---|---|---|
| Plataforma y Tenancy | tenant, subscription_plan, branch | 3 |
| Usuarios y Permisos | user, role, permission, role_permission, user_branch | 5 |
| Clientes | customer, customer_contact, customer_portal_access | 3 |
| Activos | asset, asset_type, asset_photo | 3 |
| Órdenes de Trabajo | work_order, work_order_status, work_order_task, work_order_checklist, work_order_photo, work_order_comment, work_order_signature, work_order_product, work_order_service | 9 |
| Cotizaciones | quote, quote_item, quote_version | 3 |
| Productos e Inventario | product, product_category, inventory, inventory_movement | 4 |
| Servicios | service, service_category | 2 |
| Proveedores y Compras | supplier, purchase_order, purchase_order_item | 3 |
| Mantenimiento Preventivo | preventive_plan, preventive_execution | 2 |
| Notificaciones | notification_template, notification_log | 2 |
| Auditoría y Archivos | audit_log, file_attachment | 2 |
| Integraciones | webhook_endpoint, webhook_delivery | 2 |
| Sincronización | mobile_sync_log | 1 |
| **Total** | | **38 tablas** |

---

## 6. Diseño de Roles y Permisos RBAC

### 6.1 Roles Base del Sistema

| Rol | Código | Scope | Descripción |
|---|---|---|---|
| **Superadmin Plataforma** | `platform_superadmin` | Global | Administrador de la plataforma SaaS. Gestiona tenants, planes, configuración global |
| **Dueño Empresa** | `owner` | Tenant | Dueño del tenant. Acceso total. No eliminable |
| **Administrador** | `admin` | Tenant | Gestión completa del taller sin acceso a configuración de facturación del SaaS |
| **Jefe Sucursal** | `branch_manager` | Sucursal | Gestión completa de su(s) sucursal(es) asignada(s) |
| **Recepcionista** | `receptionist` | Sucursal | Ingreso de clientes, activos, OT. Sin acceso a costos internos |
| **Técnico** | `technician` | Sucursal | Ve y gestiona sus OT asignadas. Registra trabajo, repuestos, fotos |
| **Técnico Terreno** | `field_technician` | Sucursal | Igual que técnico + funciones de terreno, GPS, firma |
| **Vendedor** | `salesperson` | Sucursal | Clientes, cotizaciones, seguimiento comercial |
| **Bodega** | `warehouse` | Sucursal | Inventario, compras, recepción de productos |
| **Supervisor** | `supervisor` | Sucursal | Lectura amplia + aprobaciones. Sin edición directa |
| **Cliente Portal** | `client_portal` | Portal | Acceso al portal de seguimiento. Solo lectura de sus datos |

### 6.2 Permisos Granulares

Los permisos siguen el formato: `module:action`

**Módulos de permisos:**

```
clients          work_orders        quotes            products
inventory        services           suppliers         purchases
preventive       schedule           field_service     portal
notifications    reports            admin             integrations
audit            branches           users             roles
```

**Acciones por módulo:**

```
create           read               update            delete
export           import             configure         approve
reject           close              reopen            cancel
assign           view_costs         view_margins      print
send             sign
```

### 6.3 Matriz de Permisos

A continuación la matriz para los módulos críticos del MVP. `✅` = permitido, `❌` = denegado, `👁️` = solo lectura, `🔒` = solo lo propio.

#### Módulo: Clientes (`clients`)

| Permiso | Owner | Admin | Branch Mgr | Receptionist | Technician | Field Tech | Salesperson | Warehouse | Supervisor |
|---|---|---|---|---|---|---|---|---|---|
| `create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `read` | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 | ✅ | ❌ | ✅ |
| `update` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `export` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `import` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Módulo: Órdenes de Trabajo (`work_orders`)

| Permiso | Owner | Admin | Branch Mgr | Receptionist | Technician | Field Tech | Salesperson | Warehouse | Supervisor |
|---|---|---|---|---|---|---|---|---|---|
| `create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `read` | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 | ✅ | 👁️ | ✅ |
| `update` | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 | ❌ | ❌ | ❌ |
| `delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `assign` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `close` | ✅ | ✅ | ✅ | ❌ | 🔒 | 🔒 | ❌ | ❌ | ✅ |
| `cancel` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `reopen` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `approve` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `view_costs` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `view_margins` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `sign` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `print` | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 | ✅ | ❌ | ✅ |
| `export` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

#### Módulo: Cotizaciones (`quotes`)

| Permiso | Owner | Admin | Branch Mgr | Receptionist | Technician | Field Tech | Salesperson | Warehouse | Supervisor |
|---|---|---|---|---|---|---|---|---|---|
| `create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `read` | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 | ✅ | ❌ | ✅ |
| `update` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `send` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `approve` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `view_costs` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `view_margins` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `print` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |

#### Módulo: Inventario (`inventory`)

| Permiso | Owner | Admin | Branch Mgr | Receptionist | Technician | Field Tech | Salesperson | Warehouse | Supervisor |
|---|---|---|---|---|---|---|---|---|---|
| `read` | ✅ | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | ✅ | ✅ |
| `update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `adjust` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `view_costs` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `export` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `import` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

#### Módulo: Administración (`admin`)

| Permiso | Owner | Admin | Branch Mgr | Receptionist | Technician | Field Tech | Salesperson | Warehouse | Supervisor |
|---|---|---|---|---|---|---|---|---|---|
| `configure` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `manage_users` | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `manage_roles` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `manage_branches` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `view_audit` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `manage_billing` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 6.4 Estrategia de Implementación RBAC

```typescript
// Estructura del guard de permisos en NestJS
@Injectable()
export class PermissionGuard implements CanActivate {
  // Pipeline de validación:
  // 1. Extraer usuario del JWT
  // 2. Resolver tenant desde header/subdomain
  // 3. Validar que usuario pertenece al tenant
  // 4. Cargar permisos del rol (cacheados en Redis)
  // 5. Verificar permiso requerido por el endpoint
  // 6. Aplicar condiciones (own_only, branch_scope, cost_visible)
  // 7. Permitir o denegar
}

// Uso en controladores:
@Controller('work-orders')
export class WorkOrderController {
  
  @Post()
  @RequirePermission('work_orders:create')
  create(@Body() dto: CreateWorkOrderDto) { ... }

  @Get(':id')
  @RequirePermission('work_orders:read')
  findOne(@Param('id') id: string) { ... }

  @Patch(':id/close')
  @RequirePermission('work_orders:close')
  close(@Param('id') id: string) { ... }
}
```

**Almacenamiento de permisos en cache:**

```
Redis Key: tenant:{tenant_id}:role:{role_id}:permissions
TTL: 5 minutos
Valor: Set de strings ["work_orders:create", "work_orders:read", ...]
Invalidación: Al editar permisos del rol
```

**Condiciones especiales (JSONB en role_permission.conditions):**

```json
{
  "own_only": true,          // Solo registros creados por / asignados al usuario
  "branch_scope": true,      // Solo registros de la(s) sucursal(es) del usuario
  "cost_visible": false,     // Ocultar campos de costo
  "margin_visible": false,   // Ocultar campos de margen
  "max_discount": 15         // Descuento máximo permitido (%)
}
```

---

## 7. Estrategia Multi-Tenant

### 7.1 Modelo de Aislamiento

**Decisión: Shared Database, Shared Schema con Discriminator Column (`tenant_id`)**

```
┌─────────────────────────────────────────┐
│          PostgreSQL (Shared)             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     Schema: public              │    │
│  │                                 │    │
│  │  work_orders                    │    │
│  │  ┌─────────────────────────┐    │    │
│  │  │ tenant_id = AAA │ datos │    │    │
│  │  │ tenant_id = AAA │ datos │    │    │
│  │  │ tenant_id = BBB │ datos │    │    │
│  │  │ tenant_id = CCC │ datos │    │    │
│  │  └─────────────────────────┘    │    │
│  │                                 │    │
│  │  (todas las tablas tienen       │    │
│  │   tenant_id como discriminador) │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Justificación:**

| Criterio | Shared Schema | Schema per Tenant | DB per Tenant |
|---|---|---|---|
| Costo operacional | ✅ Mínimo | ⚠️ Medio | ❌ Alto |
| Complejidad de migraciones | ✅ Una sola | ⚠️ N migraciones | ❌ N migraciones |
| Aislamiento de datos | ⚠️ Lógico | ✅ Fuerte | ✅ Máximo |
| Escalabilidad | ✅ Sharding futuro | ⚠️ Limitado | ✅ Nativo |
| Onboarding de tenant | ✅ Instantáneo | ⚠️ Requiere DDL | ❌ Requiere infra |
| Ideal para | MVP - 10K tenants | 100-1K tenants | Enterprise dedicado |

### 7.2 Implementación del Tenant Context

```typescript
// Middleware: extrae tenant_id del JWT o subdomain
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  // 1. Extraer tenant del JWT decodificado
  // 2. O resolver desde subdomain: {slug}.tallerhub.com
  // 3. Inyectar en request context
  // 4. Validar que tenant está activo y no suspendido
}

// Service base: todas las queries filtran por tenant
@Injectable()
export abstract class BaseTenantService {
  // Inyecta automáticamente WHERE tenant_id = ?
  // en todas las operaciones de Prisma
  // Previene acceso cross-tenant incluso por error del desarrollador
}

// Prisma Middleware: red de seguridad
prisma.$use(async (params, next) => {
  // Antes de cualquier query:
  // - Inyectar tenant_id en WHERE de find/findMany/update/delete
  // - Inyectar tenant_id en data de create
  // - NUNCA permitir query sin tenant_id (excepto tablas globales)
});
```

### 7.3 Reglas de Aislamiento

| Regla | Implementación |
|---|---|
| Toda tabla tiene `tenant_id` | Enforced en schema Prisma. Excepciones: `subscription_plan`, `permission` |
| Toda query filtra por `tenant_id` | Prisma middleware automático + validación manual en queries raw |
| Índices compuestos lideran con `tenant_id` | `INDEX(tenant_id, ...)` en toda tabla de acceso frecuente |
| Foreign keys validan tenant | Constraint: el registro referenciado debe pertenecer al mismo tenant |
| APIs nunca exponen datos cross-tenant | Guards + middleware + tests de seguridad |
| Backups pueden ser por tenant | Export lógico con `WHERE tenant_id = ?` |
| Métricas separadas por tenant | Queries de reportes siempre scoped por tenant |
| Rate limiting por tenant | Redis counters con key `rate:{tenant_id}:{endpoint}` |
| Storage por tenant | S3 prefix: `tenants/{tenant_id}/...` |

### 7.4 Seguridad Multi-Tenant

**Capas de protección:**

```
Capa 1: JWT contiene tenant_id — no manipulable
Capa 2: Middleware valida tenant activo en DB/cache
Capa 3: Prisma middleware inyecta WHERE tenant_id automáticamente
Capa 4: Índices únicos compuestos (tenant_id + campo) previenen colisiones
Capa 5: Tests e2e verifican aislamiento cross-tenant
Capa 6: Audit log registra tenant en toda acción
```

---

## 8. Flujos de Negocio Clave

### 8.1 Flujo 1: Orden de Trabajo Completa (Taller)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Cliente   │    │ Registro │    │ Registro │    │ Crear OT │
│ llega     │───►│ cliente  │───►│ activo   │───►│          │
│           │    │          │    │ + fotos  │    │          │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                     │
                 Estado: INGRESADA                    │
                                                     ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│Notifica  │    │ Cliente  │    │ Emitir   │    │ Revisión │
│al cliente│◄───│ aprueba  │◄───│cotización│◄───│ técnica  │
│          │    │ online   │    │          │    │diagnóst. │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │
     │           Estado: APROBADA
     ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Asignar  │    │Repuestos │    │ Trabajo  │    │ Registro │
│ técnico  │───►│ de stock │───►│ técnico  │───►│fotos,    │
│          │    │reservados│    │          │    │notas,hrs │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                     │
                 Estado: EN REPARACIÓN               │
                                                     ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Reporte  │    │ Cierre   │    │ Firma    │    │Notifica  │
│rentabili-│◄───│administ. │◄───│ entrega  │◄───│OT lista  │
│dad       │    │          │    │ cliente  │    │al cliente│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                     │
                 Estado: ENTREGADA                   │
                                                     ▼
                                              ┌──────────┐
                                              │   PDF    │
                                              │ generado │
                                              └──────────┘
```

**Eventos del sistema durante este flujo:**

1. `customer.created` → Log de auditoría
2. `asset.created` → Genera QR único
3. `work_order.created` → Notificación email/push al cliente, correlativo generado
4. `work_order.status_changed` → Notificación al cliente, log de auditoría
5. `quote.sent` → Email con link de aprobación al cliente
6. `quote.approved` → Actualiza OT, notifica al taller
7. `work_order.product_added` → Descuenta stock reservado del inventario
8. `work_order.completed` → Calcula totales, margen, notifica al cliente
9. `work_order.signature_added` → Almacena firma, marca como entregada
10. `work_order.closed` → Genera PDF, actualiza métricas del dashboard

### 8.2 Flujo 2: Mantenimiento Preventivo

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Plan creado  │    │  Cron check  │    │  Alerta      │
│  para activo  │───►│  diario      │───►│  "próximo    │
│  (cada 6m)    │    │              │    │  vencimiento"│
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                    (7 días antes)              │
                                               ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Nueva       │    │  Genera OT   │    │  Fecha       │
│  programación│◄───│  automática  │◄───│  cumplida    │
│  calculada   │    │  con template│    │              │
└──────────────┘    └──────────────┘    └──────────────┘
       │
       │            OT tiene tareas, repuestos y
       │            servicios pre-cargados del template
       ▼
┌──────────────┐
│  Ejecución   │
│  normal de   │
│  OT (Flujo 1)│
└──────────────┘
```

**Motor de cálculo:**

| Tipo frecuencia | Lógica de vencimiento |
|---|---|
| `days` / `weeks` / `months` | `next_due_at = last_executed_at + frequency_value * unit` |
| `kilometers` | `vencido si asset.mileage >= next_due_mileage` |
| `hours` | `vencido si asset.mileage >= next_due_mileage` (mileage_unit = hours) |

**Worker BullMQ:** Job diario (`preventive-check`) que:
1. Busca planes activos con `next_due_at <= NOW() + alert_before_value`
2. Envía alertas para los próximos a vencer
3. Genera OT automáticas para los ya vencidos
4. Recalcula `next_due_at` post-ejecución

### 8.3 Flujo 3: Servicio a Domicilio

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Solicitud   │    │  Crear OT    │    │  Agendar     │
│  de servicio │───►│  tipo terreno│───►│  en calendario│
│  a domicilio │    │  + dirección │    │  + técnico   │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                    App notifica al técnico     │
                                               ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Registra    │    │  Inicia      │    │  Técnico     │
│  fotos,      │◄───│  trabajo     │◄───│  navega GPS  │
│  checklist   │    │  en sitio    │    │  a dirección │
└──────────────┘    └──────────────┘    └──────────────┘
       │
       │  (todo en app móvil, puede ser offline)
       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Reporte de  │    │  Sync al     │    │  Firma del   │
│  visita PDF  │◄───│  servidor    │◄───│  cliente en  │
│  generado    │    │  automático  │    │  sitio (app) │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                    Constatación: timestamp     │
                    + coordenadas GPS           │
                    + fotos geolocalizadas      ▼
                                        ┌──────────────┐
                                        │  Repuestos   │
                                        │  usados      │
                                        │  registrados │
                                        └──────────────┘
```

**Modo offline del técnico:**

1. Al inicio del día, la app descarga OT asignadas + datos de clientes + catálogo de servicios/productos
2. Técnico trabaja sin conexión: cambia estados, agrega fotos (almacenadas localmente), registra repuestos, obtiene firma
3. Al recuperar conexión: sync incremental con resolución de conflictos (last-write-wins para campos simples, merge para colecciones)
4. Conflictos irresolubles se marcan para revisión manual del supervisor

### 8.4 Flujo 4: Compra e Inventario

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Alerta de   │    │  Crear orden │    │  Enviar a    │
│  stock bajo  │───►│  de compra   │───►│  proveedor   │
│  (auto)      │    │  (borrador)  │    │              │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                    Estado: ENVIADA             │
                                               ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Stock       │    │  Registrar   │    │  Proveedor   │
│  actualizado │◄───│  recepción   │◄───│  entrega     │
│  automátic.  │    │(parcial/total│    │  mercadería  │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │
       │  Movimiento:      │  Si parcial: estado
       │  purchase_in      │  PARCIALMENTE_RECIBIDA
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  Kardex      │    │  Costo real  │
│  actualizado │    │  registrado  │
│              │    │  por unidad  │
└──────────────┘    └──────────────┘

--- Consumo desde OT ---

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Técnico     │    │  Stock       │    │  Movimiento: │
│  agrega      │───►│  reservado   │───►│work_order_out│
│  repuesto OT │    │  se descuenta│    │  en kardex   │
└──────────────┘    └──────────────┘    └──────────────┘
```

**Reglas de inventario:**

| Regla | Detalle |
|---|---|
| Stock disponible | `quantity - reserved_quantity` |
| Reserva al agregar a OT | `reserved_quantity += cantidad` |
| Consumo al cerrar OT | `quantity -= cantidad`, `reserved_quantity -= cantidad`, crea `inventory_movement` |
| Alerta stock bajo | Worker verifica `quantity <= min_stock` diariamente + al recibir movimiento |
| Ajuste manual | Requiere `reason`, crea movimiento tipo `adjustment`, registra `created_by` |
| Transferencia entre sucursales | Dos movimientos: `transfer_out` + `transfer_in` atómicos |

### 8.5 Flujo 5: Portal del Cliente

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Cliente     │    │  Ingresa     │    │  Ve estado   │
│  recibe link │───►│  código o    │───►│  actual de   │
│  por email/  │    │  hace login  │    │  su OT       │
│  WhatsApp    │    │              │    │              │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                    Portal con branding        │
                    del taller                 │
                                               ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Descarga    │    │  Aprueba o   │    │  Ve          │
│  PDF de OT   │◄───│  rechaza     │◄───│  cotización  │
│  o cotización│    │  cotización  │    │  pendiente   │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │
       │                   │  Evento: quote.approved
       │                   │  → Notifica al taller
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  Ve fotos    │    │  Recibe      │
│  de su equipo│    │  notifica-   │
│  y progreso  │    │  ciones de   │
│              │    │  cambios     │
└──────────────┘    └──────────────┘
```

**Seguridad del portal:**

- Acceso por `access_code` (6 caracteres alfanuméricos) o login con email + password
- Token JWT con scope limitado (`client_portal`)
- Solo puede ver datos propios (validación `customer_id`)
- No puede ver costos internos, notas internas ni datos de otros clientes
- Rate limiting agresivo para prevenir enumeración de códigos
- Expiración de sesión: 24 horas

---

## 9. Roadmap Detallado

### 9.1 Criterios de Priorización

| Criterio | Peso | Descripción |
|---|---|---|
| **Valor al usuario** | 40% | ¿Resuelve un problema diario crítico del taller? |
| **Diferenciación** | 20% | ¿Nos distingue de alternativas gratuitas (Excel, papel)? |
| **Complejidad técnica** | 20% | ¿Cuánto esfuerzo de desarrollo requiere? (inverso) |
| **Dependencias** | 10% | ¿Puede construirse sin otros módulos? |
| **Monetización** | 10% | ¿Habilita un plan de pago superior? |

### 9.2 MVP — Fase 1 (Semanas 1-10)

**Objetivo:** Producto mínimo vendible. Un taller debe poder operar su día a día completo.

| Módulo | Alcance MVP | Semanas |
|---|---|---|
| **Infraestructura** | Auth, multi-tenant, CI/CD, Docker, Prisma schema | 1-2 |
| **Administración** (base) | Tenant setup, sucursales, usuarios, roles fijos | 2-3 |
| **Clientes** | CRUD completo, contactos, búsqueda, importación | 3-4 |
| **Activos** | CRUD, fotos, QR, historial básico | 4-5 |
| **Productos + Inventario** | Catálogo, stock por sucursal, movimientos básicos | 5-6 |
| **Servicios** | Catálogo de servicios con precios | 5-6 |
| **Órdenes de Trabajo** | Flujo completo: crear → asignar → trabajar → cerrar → PDF | 6-8 |
| **Cotizaciones** | Crear, enviar, aprobar, convertir a OT, PDF | 8-9 |
| **Dashboard** (básico) | OT por estado, KPIs principales, resumen financiero | 9-10 |
| **Frontend Web** | Login, dashboard, CRUD de todos los módulos MVP | Paralelo 4-10 |

**Entregable MVP:**

- ✅ Un taller puede registrar clientes y equipos
- ✅ Crear y gestionar órdenes de trabajo completas
- ✅ Cotizar con aprobación del cliente
- ✅ Controlar inventario básico
- ✅ Ver dashboard operativo
- ✅ Multi-tenant funcional
- ✅ RBAC con roles fijos
- ✅ Generación de PDF

### 9.3 V2 — Fase 2 (Semanas 11-20)

**Objetivo:** Funcionalidades que generan retención y habilitan planes superiores.

| Módulo | Alcance V2 | Semanas |
|---|---|---|
| **Proveedores y Compras** | CRUD proveedores, OC, recepción, ingreso a inventario | 11-12 |
| **Mantenimiento Preventivo** | Planes, alertas, generación automática de OT | 12-13 |
| **Agenda** | Calendario, vista por técnico, drag & drop | 13-14 |
| **Portal Cliente** | Seguimiento, aprobación cotizaciones, fotos, PDFs | 14-16 |
| **App Móvil Técnico** | Login, OT asignadas, cambiar estado, fotos, firma | 16-18 |
| **Notificaciones** | Email + push + plantillas + disparadores automáticos | 18-19 |
| **Dashboard** (completo) | Reportes financieros, productividad, exportación | 19-20 |
| **Admin** (avanzado) | Roles custom, permisos granulares, branding, configuración | Paralelo |

**Entregable V2:**

- ✅ Compras y control de costos reales
- ✅ Preventivos automáticos
- ✅ Planificación visual del taller
- ✅ Clientes consultan estado online
- ✅ Técnicos trabajan desde celular
- ✅ Notificaciones automáticas
- ✅ Reportes ejecutivos

### 9.4 V3 — Fase 3 (Semanas 21-30)

**Objetivo:** Diferenciación máxima y funcionalidades enterprise.

| Módulo | Alcance V3 | Semanas |
|---|---|---|
| **Servicio a Domicilio** | Geolocalización, rutas, constatación GPS, cierre en terreno | 21-23 |
| **App Móvil** (avanzada) | Modo offline completo, sync inteligente, escaneo QR | 23-25 |
| **Integraciones** | API pública, webhooks, WhatsApp Business API | 25-27 |
| **Notificaciones** (avanzadas) | SMS, WhatsApp, automatizaciones complejas | 27-28 |
| **Admin** (enterprise) | White-label parcial, SSO, API keys, límites por plan | 28-29 |
| **Optimizaciones** | Performance, caching avanzado, partitioning, monitoring | 29-30 |

**Entregable V3:**

- ✅ Servicio a domicilio con GPS y app
- ✅ Modo offline real para técnicos
- ✅ API pública para integraciones
- ✅ WhatsApp Business integrado
- ✅ Preparado para facturación electrónica
- ✅ White-label parcial
- ✅ Performance optimizada para escala

### 9.5 Timeline Visual

```
Semana:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
         ├──────────────────────────────┤├────────────────────────────────────┤├──────────────────────┤
         │         MVP (Fase 1)         ││           V2 (Fase 2)              ││    V3 (Fase 3)       │
         │                              ││                                    ││                      │
Infra    ████                           ││                                    ││                      │
Admin    ░░████                         ││                              ██████││                ██████│
Clientes     ████                       ││                                    ││                      │
Activos        ████                     ││                                    ││                      │
Productos       ██████                  ││                                    ││                      │
Servicios       ████                    ││                                    ││                      │
OT               ████████████           ││                                    ││                      │
Cotizac.               ██████           ││                                    ││                      │
Dashboard                  ████         ││                              ██████││                      │
Frontend      ██████████████████████████││                                    ││                      │
Proveed.                                ││████████                            ││                      │
Prevent.                                ││    ████████                        ││                      │
Agenda                                  ││        ████████                    ││                      │
Portal                                  ││            ████████████            ││                      │
App Móvil                               ││                    ████████████    ││        ████████████  │
Notific.                                ││                            ████████││            ████████  │
Domicilio                               ││                                    ││████████████          │
Integrac.                               ││                                    ││        ████████████  │
```

---

## 10. Riesgos Técnicos y Mitigación

### 10.1 Matriz de Riesgos

| # | Riesgo | Probabilidad | Impacto | Severidad | Mitigación |
|---|---|---|---|---|---|
| R1 | **Complejidad del modelo de datos causa lentitud en desarrollo** | Alta | Alto | 🔴 Crítico | Implementar en fases. MVP con 60% de las tablas. Prisma schema incremental. No sobre-ingenierizar campos JSONB |
| R2 | **Multi-tenant mal implementado causa fuga de datos** | Media | Crítico | 🔴 Crítico | Prisma middleware obligatorio. Tests e2e de aislamiento. Code review focalizado en tenant_id. Nunca queries raw sin WHERE tenant_id |
| R3 | **Performance degrada con volumen de datos** | Media | Alto | 🟠 Alto | Índices compuestos desde día uno. Paginación cursor-based. Monitoreo slow queries. Connection pooling. Partitioning de audit_log |
| R4 | **Sincronización offline genera conflictos irresolubles** | Alta | Medio | 🟠 Alto | Implementar offline después del MVP. Last-write-wins por defecto. Cola de conflictos para revisión manual. Sync granular por campo, no por registro |
| R5 | **Scope creep extiende indefinidamente el MVP** | Alta | Alto | 🟠 Alto | MVP definido y congelado en este documento. Todo lo no listado aquí es V2 o V3. Un solo Product Owner toma decisiones de priorización |
| R6 | **Dependencia de servicios externos (S3, SMTP, WhatsApp)** | Media | Medio | 🟡 Medio | Interfaces abstraídas. MinIO local para desarrollo. Fallback de notificaciones (email si WhatsApp falla). Circuit breakers |
| R7 | **Un solo desarrollador / bus factor** | Alta | Alto | 🟠 Alto | Documentación exhaustiva (este documento). Código con convenciones estrictas. Tests automatizados. README detallado por módulo |
| R8 | **Generación de PDFs lenta o inconsistente** | Media | Medio | 🟡 Medio | Generación async vía BullMQ. Puppeteer/Chromium headless para HTML→PDF. Templates HTML con Handlebars. Cache de PDFs generados |
| R9 | **Expo/React Native limita funcionalidad nativa** | Baja | Medio | 🟡 Medio | Expo Modules API cubre cámara, GPS, almacenamiento. Si se requiere native bridge, ejectar de Expo managed workflow |
| R10 | **Costos de infraestructura escalan más rápido que ingresos** | Media | Alto | 🟠 Alto | Comenzar en infra mínima (1 VPS). Escalar bajo demanda. Monitorear costo por tenant. Límites de storage por plan |

### 10.2 Plan de Contingencia

| Escenario | Plan de Acción |
|---|---|
| **Fuga de datos entre tenants** | Hotfix inmediato. Auditoría completa. Notificación a tenants afectados. Review de todo middleware de tenant. Tests de regresión |
| **Base de datos corrupta** | Restore desde backup automatizado (diario). RPO máximo: 24h. WAL archiving para point-in-time recovery |
| **Servicio caído > 1 hora** | Failover a replica de lectura. Comunicación proactiva a usuarios. Post-mortem documentado |
| **MVP no se completa en 10 semanas** | Recortar: dashboard básico se simplifica a contadores. Importación masiva pasa a V2. Priorizar OT como núcleo |

### 10.3 Decisiones Técnicas de Mitigación Proactiva

| Decisión | Razón |
|---|---|
| Monolito modular en vez de microservicios | Reduce complejidad operacional 10x para un equipo pequeño |
| Prisma en vez de TypeORM/Knex | Migraciones declarativas previenen drift. Type-safety previene errores runtime |
| BullMQ para todo trabajo pesado | Previene timeouts de API. Reintentos automáticos. Priorización de colas |
| shadcn/ui en vez de Material/Ant Design | Sin vendor lock-in. Componentes copiados al proyecto. Personalización total sin pelear con la librería |
| UUID en vez de auto-increment | Previene enumeración. Seguro para multi-tenant. Permite generación client-side para offline |
| Soft delete en entidades clave | Recuperación de datos. Auditoría. Integridad referencial mantenida |
| JSONB para campos flexibles | Extensibilidad sin migraciones. Ideal para campos personalizados por tipo de taller |

---

## Siguiente Paso: FASE 2

La Fase 2 del proyecto cubre:

1. **Estructura del monorepo** con workspaces
2. **Arquitectura detallada del backend NestJS** (módulos, guards, interceptors, DTOs)
3. **Arquitectura detallada del frontend Next.js** (App Router, layouts, componentes)
4. **Arquitectura de la app móvil React Native** (navegación, estado, offline)
5. **Convenciones de código** y patrón de carpetas
6. **Estrategia multi-tenant detallada** (implementación Prisma)
7. **Estrategia RBAC detallada** (guards, decoradores, cache)
8. **Docker Compose** para desarrollo local
9. **Configuración de CI/CD**

Para iniciar la Fase 2, ejecutar: *"Procede con la Fase 2"*

---

*Documento generado como parte del proyecto TallerHub — Plataforma SaaS para Gestión de Talleres y Servicios Técnicos.*  
*Versión 1.0.0 — Marzo 2026*
