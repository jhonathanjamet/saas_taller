# 🔧 TallerHub

**Plataforma SaaS Multi-Tenant para Gestión de Talleres y Servicios Técnicos**

---

## 📋 Descripción

TallerHub es una plataforma SaaS diseñada para digitalizar y optimizar la operación completa de talleres técnicos y servicios de reparación. Soporta múltiples tipos de taller: mecánica, electrónica, computación, celulares, audio profesional, iluminación, y más.

### Características principales

- **Multi-tenant** con aislamiento lógico por `tenant_id`
- **Multi-sucursal** nativo desde el día uno
- **RBAC granular** con 11 roles y 90+ permisos
- **Órdenes de trabajo** con flujo completo y estados configurables
- **Cotizaciones** con aprobación digital y versionado
- **Inventario** con kardex, stock por sucursal y reservas
- **Mantenimiento preventivo** con generación automática de OT
- **Portal cliente** con seguimiento en tiempo real
- **App móvil** para técnicos con modo offline
- **Notificaciones** multicanal (email, push, SMS, WhatsApp)

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | NestJS + TypeScript |
| Frontend | Next.js + Tailwind CSS + shadcn/ui |
| Mobile | React Native + Expo |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma |
| Cache | Redis |
| Colas | BullMQ |
| Almacenamiento | S3 Compatible |

---

## 📦 Requisitos Previos

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 15
- **npm** o **yarn**

---

## 🚀 Setup Rápido

### 1. Clonar e instalar dependencias

```bash
cd saas_taller
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

### 3. Crear la base de datos

```bash
createdb tallerhub
# o desde psql:
# CREATE DATABASE tallerhub;
```

### 4. Ejecutar migraciones

```bash
npm run prisma:migrate
```

### 5. Generar el cliente Prisma

```bash
npm run prisma:generate
```

### 6. Ejecutar seeds

```bash
npm run prisma:seed
```

### 7. Abrir Prisma Studio (opcional)

```bash
npm run prisma:studio
```

---

## 📝 Comandos Útiles

| Comando | Descripción |
|---|---|
| `npm run prisma:generate` | Genera el cliente Prisma |
| `npm run prisma:migrate` | Ejecuta migraciones pendientes |
| `npm run prisma:migrate:prod` | Deploy de migraciones en producción |
| `npm run prisma:seed` | Ejecuta seeds de datos base |
| `npm run prisma:studio` | Abre Prisma Studio (GUI) |
| `npm run prisma:reset` | Reset completo (¡borra datos!) |
| `npm run prisma:format` | Formatea el schema.prisma |
| `npm run prisma:validate` | Valida el schema.prisma |

---

## 🗃️ Estructura del Modelo de Datos

### 38 tablas organizadas en 14 grupos

| Grupo | Tablas | Cantidad |
|---|---|---|
| **Plataforma y Tenancy** | subscription_plan, tenant, branch | 3 |
| **Usuarios y Permisos** | user, role, permission, role_permission, user_branch | 5 |
| **Clientes** | customer, customer_contact, customer_portal_access | 3 |
| **Activos** | asset, asset_type, asset_photo | 3 |
| **Órdenes de Trabajo** | work_order, work_order_status, work_order_task, work_order_item, work_order_photo, work_order_comment, work_order_signature | 7 |
| **Cotizaciones** | quote, quote_item | 2 |
| **Productos e Inventario** | product, product_category, inventory, inventory_movement | 4 |
| **Servicios** | service | 1 |
| **Proveedores y Compras** | supplier, purchase_order, purchase_order_item | 3 |
| **Mantenimiento Preventivo** | preventive_plan, preventive_execution | 2 |
| **Notificaciones** | notification_template, notification_log | 2 |
| **Auditoría y Archivos** | audit_log, file_attachment | 2 |
| **Integraciones** | webhook_endpoint | 1 |
| **Sincronización** | mobile_sync_log | 1 |

### Diagrama de relaciones principales

```
Tenant ──┬── Branch ──── Inventory
         ├── User ────── UserBranch
         ├── Role ────── RolePermission ── Permission
         ├── Customer ─┬─ Asset ─── AssetPhoto
         │             ├─ WorkOrder ─┬─ Task
         │             │             ├─ Item (products/services)
         │             │             ├─ Photo
         │             │             ├─ Comment
         │             │             └─ Signature
         │             └─ Quote ──── QuoteItem
         ├── Product ── Inventory ── InventoryMovement
         ├── Service
         ├── Supplier ── PurchaseOrder ── PurchaseOrderItem
         └── PreventivePlan ── PreventiveExecution
```

---

## 🔐 Roles del Sistema

| Rol | Código | Scope |
|---|---|---|
| Superadmin Plataforma | `platform_superadmin` | Global |
| Dueño | `owner` | Tenant |
| Administrador | `admin` | Tenant |
| Jefe de Sucursal | `branch_manager` | Sucursal |
| Recepcionista | `receptionist` | Sucursal |
| Técnico | `technician` | Sucursal |
| Técnico Terreno | `field_technician` | Sucursal |
| Vendedor | `salesperson` | Sucursal |
| Bodega | `warehouse` | Sucursal |
| Supervisor | `supervisor` | Sucursal |
| Cliente Portal | `client_portal` | Portal |

---

## 📊 Estados de Orden de Trabajo

```
Ingresada → En Revisión → Pendiente Aprobación → Aprobada
  → Esperando Repuesto → En Reparación → Lista para Entrega
  → Entregada ✓
  → Cancelada ✗
  → Garantía (reapertura)
```

---

## 🔑 Credenciales Demo

| Campo | Valor |
|---|---|
| Email | `admin@demotaller.cl` |
| Password | `Admin123!` |
| Tenant | Demo Taller (`demo-taller`) |

---

## 📁 Estructura del Proyecto

```
saas_taller/
├── docs/                    # Documentación del proyecto
│   ├── 01-arquitectura.md   # Arquitectura y modelo de datos
│   └── 02-implementacion.md # Guía de implementación
├── prisma/
│   ├── schema.prisma        # Esquema completo (38 tablas)
│   ├── seed.ts              # Seed de datos base
│   └── migrations/          # Migraciones de BD
├── src/                     # Código fuente del backend
│   ├── modules/             # Módulos NestJS
│   ├── common/              # Utilidades compartidas
│   └── config/              # Configuración
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## ▶️ Levantar en local

Backend (NestJS):

```bash
cd /Users/jjamet/Downloads/saas_taller
npm run start:dev
```

Frontend (Next.js):

```bash
cd /Users/jjamet/Downloads/saas_taller/web
npm run dev
```

---

## ☁️ Deploy v1 gratis

Guía lista para publicar: [`DEPLOY_V1_GRATIS.md`](./DEPLOY_V1_GRATIS.md)

---

## 📄 Licencia

Proyecto privado — Todos los derechos reservados.
