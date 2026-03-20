# 🧩 TallerHub — Implementación y Estructura (Fase 2)

**Versión:** 1.1.0  
**Fecha:** 13 de marzo de 2026  
**Clasificación:** Documento de Implementación — Fase 2  
**Prerrequisito:** [01-arquitectura.md](./01-arquitectura.md)  
**Estado:** Aprobado para desarrollo

---

## Tabla de Contenidos

1. [Estructura de Repositorio](#1-estructura-de-repositorio)
2. [Arquitectura Backend NestJS](#2-arquitectura-backend-nestjs)
3. [Arquitectura Frontend Next.js](#3-arquitectura-frontend-nextjs)
4. [Arquitectura App Móvil](#4-arquitectura-app-móvil)
5. [Convenciones](#5-convenciones)
6. [Patrón de Carpetas](#6-patrón-de-carpetas)
7. [Estrategia Multi-Tenant](#7-estrategia-multi-tenant)
8. [Estrategia RBAC](#8-estrategia-rbac)
9. [Pasos Exactos para Iniciar](#9-pasos-exactos-para-iniciar)

---

## 1. Estructura de Repositorio

**Decisión:** Monorepo con `pnpm` + `turborepo`.  
**Motivo:** comparte tipos, validaciones y lógica de dominio entre backend, web y mobile sin duplicar.

**Estructura raíz propuesta:**

```
tallerhub/
├── apps/
│   ├── api/                     # NestJS (backend)
│   ├── web/                     # Next.js (admin)
│   ├── portal/                  # Next.js (cliente)
│   └── mobile/                  # React Native/Expo
├── packages/
│   ├── shared/                  # tipos, enums, utils puros
│   ├── ui/                      # componentes UI compartidos (web)
│   ├── eslint-config/
│   └── tsconfig/
├── infra/
│   ├── docker/                  # Dockerfiles
│   ├── compose/                 # docker-compose.yml
│   └── nginx/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── docs/
│   ├── 01-arquitectura.md
│   ├── 02-implementacion.md
│   └── 03-prisma-schema.md
├── scripts/
├── .env.example
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Comandos base del monorepo:**

```
pnpm dev                 # corre todo
pnpm dev --filter web    # solo web
pnpm dev --filter api    # solo API
pnpm dev --filter mobile # solo mobile
```

---

## 2. Arquitectura Backend NestJS

**Estilo:** Monolito modular con módulos de dominio.  
**Patrón:** Controlador → Servicio → Repositorio (Prisma) → DB.

**Módulos core:**

- `AuthModule` (JWT, refresh, sesiones)
- `TenantModule` (tenant context)
- `UsersModule`, `RolesModule`, `PermissionsModule`
- `CustomersModule`, `AssetsModule`
- `WorkOrdersModule`, `QuotesModule`
- `ProductsModule`, `InventoryModule`
- `ServicesModule`, `SuppliersModule`, `PurchasesModule`
- `PreventiveModule`, `ScheduleModule`, `FieldServiceModule`
- `NotificationsModule`, `PortalModule`
- `ReportsModule`
- `IntegrationsModule` (webhooks)
- `AuditModule`, `FilesModule`

**Capas de infraestructura:**

- `PrismaService` único con middleware para multi‑tenant.
- `QueueService` para BullMQ.
- `CacheService` para Redis.
- `StorageService` para S3.

**Contratos internos:**

- DTOs con `class-validator`.
- Tipos compartidos en `packages/shared`.
- Excepciones normalizadas con `HttpException` + filtros globales.

---

## 3. Arquitectura Frontend Next.js

**Stack:** Next.js App Router + Tailwind + shadcn/ui.  
**Objetivo:** panel administrativo de alta densidad, rápido y usable.

**Decisiones:**

- Rutas por módulo: `/clientes`, `/activos`, `/ordenes`, `/cotizaciones`.
- Layout por contexto: `AdminLayout` con sidebar, header y buscador.
- State: `react-query` para cache y sincronización de datos.
- Validación: Zod en formularios.
- UI: `DataTable` reutilizable con filtros persistentes.

**Estructura web:**

```
apps/web/
├── app/
│   ├── (auth)/
│   ├── (admin)/
│   └── layout.tsx
├── components/
├── lib/
├── services/
└── styles/
```

---

## 4. Arquitectura App Móvil

**Stack:** React Native + Expo.  
**Enfoque:** offline-first para técnicos.

**Decisiones:**

- Cache local con `expo-sqlite`.
- Sincronización incremental con colas locales.
- Resolución de conflictos simple: last-write-wins en campos simples, merge en colecciones.
- Navegación con `@react-navigation`.

**Estructura mobile:**

```
apps/mobile/
├── src/
│   ├── screens/
│   ├── components/
│   ├── services/
│   ├── storage/
│   └── sync/
```

---

## 5. Convenciones

- Idioma: español en UI, inglés en código.
- Nombres: `snake_case` en BD, `camelCase` en TS.
- Fechas: ISO 8601 siempre.
- Timestamps: `created_at`, `updated_at`, `deleted_at`.
- Logs: JSON estructurado con `trace_id`.

---

## 6. Patrón de Carpetas

**Backend (apps/api/src):**

```
src/
├── modules/
│   ├── work-orders/
│   │   ├── work-orders.controller.ts
│   │   ├── work-orders.service.ts
│   │   ├── dto/
│   │   └── work-orders.module.ts
├── common/
│   ├── guards/
│   ├── filters/
│   ├── interceptors/
│   └── utils/
├── infra/
│   ├── prisma/
│   ├── cache/
│   ├── queue/
│   └── storage/
└── main.ts
```

---

## 7. Estrategia Multi-Tenant

**Modelo:** Shared DB + shared schema + `tenant_id`.

**Implementación:**

- `TenantMiddleware` resuelve tenant por subdominio o header.
- `RequestContext` (CLS) guarda `tenantId`.
- Prisma middleware fuerza `tenant_id` en todas las queries.
- Índices compuestos con `tenant_id`.

**Regla crítica:** no se permiten queries sin `tenant_id` salvo tablas globales.

---

## 8. Estrategia RBAC

**Formato:** `module:action` con condiciones.

**Implementación:**

- Decorador `@RequirePermission('work_orders:create')`.
- Guard `PermissionGuard` con cache en Redis.
- Condiciones opcionales (`own_only`, `branch_scope`, `view_costs`).

**Clave Redis:**

```
tenant:{tenantId}:role:{roleId}:permissions
```

---

## 9. Pasos Exactos para Iniciar

1. Crear monorepo y workspaces.
2. Inicializar NestJS en `apps/api`.
3. Inicializar Next.js en `apps/web`.
4. Inicializar Expo en `apps/mobile`.
5. Crear `packages/shared` y mover enums/tipos.
6. Configurar Prisma en `apps/api`.
7. Implementar middleware multi‑tenant.
8. Implementar Auth + RBAC base.
9. Crear módulos: Clientes, Activos, Órdenes.

**Comandos sugeridos:**

```
pnpm dlx create-next-app@latest apps/web --ts --app
pnpm dlx @nestjs/cli new apps/api --package-manager pnpm
pnpm dlx create-expo-app apps/mobile
pnpm add -w turbo
```

---

**Siguiente paso:** avanzar a la Fase 3 con el esquema Prisma completo y seeds base.
