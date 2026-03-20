# 🧱 TallerHub — Prisma, Migraciones y Seeds (Fase 3)

**Versión:** 1.0.0  
**Fecha:** 13 de marzo de 2026  
**Clasificación:** Documento de Implementación — Fase 3  
**Prerrequisito:** [02-implementacion.md](./02-implementacion.md)  
**Estado:** Aprobado para desarrollo

---

## Objetivo de la Fase 3

1. Definir el **esquema Prisma completo** para el dominio.
2. Ejecutar **migraciones iniciales**.
3. Poblar **datos base**: planes, roles, permisos y estados de OT.

Esta fase deja lista la base para comenzar el MVP.

---

## 1. Esquema Prisma Completo

**Archivo fuente:** `prisma/schema.prisma`

**Convenciones del schema:**

- `UUID` como PK en todas las tablas.
- `tenant_id` en todas las entidades de dominio.
- `created_at`, `updated_at`, `deleted_at`.
- Soft delete en entidades core.
- Índices compuestos liderados por `tenant_id`.
- Enums para estados críticos.

**Grupos principales (38 tablas):**

- Plataforma: `subscription_plan`, `tenant`, `branch`
- Usuarios y permisos: `user`, `role`, `permission`, `role_permission`, `user_branch`
- Clientes y activos: `customer`, `customer_contact`, `customer_portal_access`, `asset`, `asset_type`, `asset_photo`
- Órdenes y cotizaciones: `work_order`, `work_order_status`, `work_order_task`, `work_order_checklist`, `work_order_photo`, `work_order_comment`, `work_order_signature`, `work_order_item`, `quote`, `quote_item`
- Inventario: `product`, `product_category`, `inventory`, `inventory_movement`
- Servicios y compras: `service`, `supplier`, `purchase_order`, `purchase_order_item`
- Preventivos: `preventive_plan`, `preventive_execution`
- Notificaciones: `notification_template`, `notification_log`
- Plataforma y trazabilidad: `audit_log`, `file_attachment`, `webhook_endpoint`, `webhook_delivery`, `mobile_sync_log`

**Ubicación actual del schema:**

- `prisma/schema.prisma`

---

## 2. Migraciones Iniciales

**Objetivo:** generar la primera migración con toda la estructura base.

**Comando recomendado:**

```
npm run prisma:migrate
```

**Resultado esperado:**

- Carpeta `prisma/migrations/` con la migración `init`.
- Base de datos creada con todas las tablas y enums.

**Notas:**

- La base debe existir antes de correr la migración.
- En entornos CI/CD usar `npm run prisma:migrate:prod`.

---

## 3. Seed de Datos Base

**Archivo:** `prisma/seed.ts`  

**Incluye:**

- Planes de suscripción (`starter`, `professional`, `business`, `enterprise`)
- Tenant demo + sucursal demo
- Roles base del sistema
- Permisos granulares por módulo/acción
- Asignación de permisos por rol
- Usuario admin demo
- Estados iniciales de orden de trabajo
- Categorías base de productos
- Tipos de activos base
- Plantillas de notificaciones base

**Comando recomendado:**

```
npm run prisma:seed
```

**Credenciales demo creadas:**

- Email: `admin@demotaller.cl`
- Password: `Admin123!`
- Tenant: `demo-taller`

---

## 4. Estados Iniciales de Orden

Se cargan en el seed para el tenant demo:

- `ingresada`
- `en_revision`
- `pendiente_aprobacion`
- `aprobada`
- `esperando_repuesto`
- `en_reparacion`
- `lista_entrega`
- `entregada`
- `cancelada`
- `garantia`

---

## 5. Roles Iniciales

- `platform_superadmin`
- `owner`
- `admin`
- `branch_manager`
- `receptionist`
- `technician`
- `field_technician`
- `salesperson`
- `warehouse`
- `supervisor`
- `client_portal`

---

## 6. Permisos Iniciales

Formato: `module:action` con permisos por:

- Módulo: `clients`, `assets`, `work_orders`, `quotes`, `products`, `inventory`, `services`, `suppliers`, `purchases`, `preventive`, `schedule`, `field_service`, `portal`, `notifications`, `reports`, `admin`, `integrations`
- Acción: `create`, `read`, `update`, `delete`, `export`, `import`, `assign`, `close`, `cancel`, `reopen`, `approve`, `view_costs`, `view_margins`, `sign`, `print`, `send`, `receive`, `configure`, `manage`

---

## 7. Checklist de Validación

1. `prisma/schema.prisma` valida correctamente.
2. Migración `init` creada y aplicada.
3. Seed ejecutado sin errores.
4. Usuario demo puede iniciar sesión.
5. Estados de OT existen para el tenant demo.

---

## 8. Siguiente Paso

Pasar a **Fase 4**: implementar el backend MVP (auth, tenants, sucursales, clientes, activos, OT, cotizaciones, inventario, servicios y reportes básicos) y generar Swagger.
