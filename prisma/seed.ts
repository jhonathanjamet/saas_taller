// =============================================================================
// TallerHub — Seed de Datos Base
// =============================================================================
// Idempotente: puede ejecutarse múltiples veces sin duplicar datos.
// Usa upsert para todas las operaciones.
// =============================================================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// IDs fijos para entidades de seed (permite idempotencia)
// ---------------------------------------------------------------------------
const IDS = {
  // Planes
  planStarter: '00000000-0000-0000-0000-000000000001',
  planProfessional: '00000000-0000-0000-0000-000000000002',
  planBusiness: '00000000-0000-0000-0000-000000000003',
  planEnterprise: '00000000-0000-0000-0000-000000000004',
  // Tenant demo
  tenantDemo: '10000000-0000-0000-0000-000000000001',
  // Branch demo
  branchDemo: '20000000-0000-0000-0000-000000000001',
  // Roles (de sistema, sin tenant_id)
  roleSuperadmin: '30000000-0000-0000-0000-000000000001',
  // Roles (del tenant demo)
  roleOwner: '30000000-0000-0000-0000-000000000010',
  roleAdmin: '30000000-0000-0000-0000-000000000011',
  roleBranchManager: '30000000-0000-0000-0000-000000000012',
  roleReceptionist: '30000000-0000-0000-0000-000000000013',
  roleTechnician: '30000000-0000-0000-0000-000000000014',
  roleFieldTechnician: '30000000-0000-0000-0000-000000000015',
  roleSalesperson: '30000000-0000-0000-0000-000000000016',
  roleWarehouse: '30000000-0000-0000-0000-000000000017',
  roleSupervisor: '30000000-0000-0000-0000-000000000018',
  roleClientPortal: '30000000-0000-0000-0000-000000000019',
  // Usuario admin demo
  userAdmin: '40000000-0000-0000-0000-000000000001',
};

// ---------------------------------------------------------------------------
// 1. Planes de suscripción
// ---------------------------------------------------------------------------
async function seedPlans() {
  console.log('🏗️  Seeding planes de suscripción...');

  const plans = [
    {
      id: IDS.planStarter,
      name: 'Starter',
      code: 'starter',
      maxUsers: 3,
      maxBranches: 1,
      enabledModules: ['clients', 'assets', 'work_orders', 'quotes', 'products', 'services', 'dashboard'],
      maxStorageGb: 5,
      priceMonthly: 19.0,
      priceYearly: 190.0,
      currency: 'USD',
      isActive: true,
    },
    {
      id: IDS.planProfessional,
      name: 'Professional',
      code: 'professional',
      maxUsers: 10,
      maxBranches: 3,
      enabledModules: [
        'clients', 'assets', 'work_orders', 'quotes', 'products', 'services',
        'inventory', 'preventive', 'portal', 'notifications', 'dashboard', 'reports',
      ],
      maxStorageGb: 25,
      priceMonthly: 49.0,
      priceYearly: 490.0,
      currency: 'USD',
      isActive: true,
    },
    {
      id: IDS.planBusiness,
      name: 'Business',
      code: 'business',
      maxUsers: 25,
      maxBranches: 5,
      enabledModules: [
        'clients', 'assets', 'work_orders', 'quotes', 'products', 'services',
        'inventory', 'suppliers', 'purchases', 'preventive', 'schedule',
        'field_service', 'portal', 'notifications', 'dashboard', 'reports',
        'admin', 'integrations',
      ],
      maxStorageGb: 100,
      priceMonthly: 99.0,
      priceYearly: 990.0,
      currency: 'USD',
      isActive: true,
    },
    {
      id: IDS.planEnterprise,
      name: 'Enterprise',
      code: 'enterprise',
      maxUsers: null, // Ilimitado
      maxBranches: null,
      enabledModules: [], // Todos
      maxStorageGb: null,
      priceMonthly: 299.0,
      priceYearly: 2990.0,
      currency: 'USD',
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        maxUsers: plan.maxUsers,
        maxBranches: plan.maxBranches,
        enabledModules: plan.enabledModules,
        maxStorageGb: plan.maxStorageGb,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        isActive: plan.isActive,
      },
      create: plan,
    });
  }

  console.log('   ✅ Planes creados');
}

// ---------------------------------------------------------------------------
// 2. Permisos granulares
// ---------------------------------------------------------------------------
async function seedPermissions() {
  console.log('🔐 Seeding permisos...');

  const modules: Record<string, string[]> = {
    clients:       ['create', 'read', 'update', 'delete', 'export', 'import'],
    assets:        ['create', 'read', 'update', 'delete', 'export'],
    work_orders:   ['create', 'read', 'update', 'delete', 'assign', 'close', 'cancel', 'reopen', 'approve', 'view_costs', 'view_margins', 'sign', 'print', 'export'],
    quotes:        ['create', 'read', 'update', 'delete', 'send', 'approve', 'view_costs', 'view_margins', 'print', 'export'],
    products:      ['create', 'read', 'update', 'delete', 'export', 'import'],
    inventory:     ['read', 'update', 'adjust', 'view_costs', 'export', 'import'],
    services:      ['create', 'read', 'update', 'delete'],
    suppliers:     ['create', 'read', 'update', 'delete', 'export'],
    purchases:     ['create', 'read', 'update', 'delete', 'receive', 'export'],
    preventive:    ['create', 'read', 'update', 'delete'],
    schedule:      ['read', 'update', 'manage'],
    field_service: ['read', 'update', 'manage'],
    portal:        ['configure', 'read'],
    notifications: ['read', 'configure', 'send'],
    reports:       ['read', 'export'],
    admin:         ['configure', 'manage_users', 'manage_roles', 'manage_branches', 'view_audit', 'manage_billing'],
    integrations:  ['configure', 'read'],
  };

  let count = 0;
  for (const [mod, actions] of Object.entries(modules)) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { module_action: { module: mod, action } },
        update: {},
        create: {
          module: mod,
          action,
          description: `${action} en ${mod}`,
        },
      });
      count++;
    }
  }

  console.log(`   ✅ ${count} permisos creados`);
}

// ---------------------------------------------------------------------------
// 3. Roles del sistema
// ---------------------------------------------------------------------------
async function seedRoles() {
  console.log('👥 Seeding roles...');

  // Rol global de plataforma (sin tenant)
  await prisma.role.upsert({
    where: { id: IDS.roleSuperadmin },
    update: {
      tenantId: null,
      name: 'Superadmin Plataforma',
      code: 'platform_superadmin',
      description: 'Administrador global de la plataforma SaaS',
      isSystem: true,
    },
    create: {
      id: IDS.roleSuperadmin,
      tenantId: null,
      name: 'Superadmin Plataforma',
      code: 'platform_superadmin',
      description: 'Administrador global de la plataforma SaaS',
      isSystem: true,
    },
  });

  // Roles del tenant demo
  const tenantRoles = [
    { id: IDS.roleOwner, code: 'owner', name: 'Dueño', description: 'Dueño del taller. Acceso total.' },
    { id: IDS.roleAdmin, code: 'admin', name: 'Administrador', description: 'Gestión completa del taller.' },
    { id: IDS.roleBranchManager, code: 'branch_manager', name: 'Jefe de Sucursal', description: 'Gestión de su(s) sucursal(es).' },
    { id: IDS.roleReceptionist, code: 'receptionist', name: 'Recepcionista', description: 'Ingreso de clientes, activos y OT.' },
    { id: IDS.roleTechnician, code: 'technician', name: 'Técnico', description: 'Gestiona sus OT asignadas.' },
    { id: IDS.roleFieldTechnician, code: 'field_technician', name: 'Técnico Terreno', description: 'Técnico con funciones de terreno.' },
    { id: IDS.roleSalesperson, code: 'salesperson', name: 'Vendedor', description: 'Clientes, cotizaciones y seguimiento comercial.' },
    { id: IDS.roleWarehouse, code: 'warehouse', name: 'Bodega', description: 'Inventario, compras, recepción.' },
    { id: IDS.roleSupervisor, code: 'supervisor', name: 'Supervisor', description: 'Lectura amplia + aprobaciones.' },
    { id: IDS.roleClientPortal, code: 'client_portal', name: 'Cliente Portal', description: 'Acceso al portal de seguimiento.' },
  ];

  for (const role of tenantRoles) {
    await prisma.role.upsert({
      where: { tenantId_code: { tenantId: IDS.tenantDemo, code: role.code } },
      update: { name: role.name, description: role.description },
      create: {
        id: role.id,
        tenantId: IDS.tenantDemo,
        name: role.name,
        code: role.code,
        description: role.description,
        isSystem: true,
      },
    });
  }

  console.log('   ✅ Roles creados');
}

// ---------------------------------------------------------------------------
// 4. Asignar permisos a roles
// ---------------------------------------------------------------------------
async function seedRolePermissions() {
  console.log('🔗 Asignando permisos a roles...');

  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map((p) => [`${p.module}:${p.action}`, p.id]));

  // Helper para asignar múltiples permisos a un rol
  async function assignPermissions(roleId: string, permKeys: string[], conditions?: any) {
    for (const key of permKeys) {
      const permissionId = permMap.get(key);
      if (!permissionId) {
        console.warn(`   ⚠️  Permiso ${key} no encontrado, saltando...`);
        continue;
      }
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: { conditions: conditions || null },
        create: { roleId, permissionId, conditions: conditions || null },
      });
    }
  }

  // Owner: TODOS los permisos
  const allPermKeys = allPermissions.map((p) => `${p.module}:${p.action}`);
  await assignPermissions(IDS.roleOwner, allPermKeys);

  // Admin: Todos excepto manage_billing
  const adminPerms = allPermKeys.filter((k) => k !== 'admin:manage_billing');
  await assignPermissions(IDS.roleAdmin, adminPerms);

  // Branch Manager
  await assignPermissions(IDS.roleBranchManager, [
    'clients:create', 'clients:read', 'clients:update', 'clients:export',
    'assets:create', 'assets:read', 'assets:update', 'assets:export',
    'work_orders:create', 'work_orders:read', 'work_orders:update', 'work_orders:assign',
    'work_orders:close', 'work_orders:cancel', 'work_orders:reopen', 'work_orders:approve',
    'work_orders:view_costs', 'work_orders:view_margins', 'work_orders:sign', 'work_orders:print', 'work_orders:export',
    'quotes:create', 'quotes:read', 'quotes:update', 'quotes:send', 'quotes:approve',
    'quotes:view_costs', 'quotes:view_margins', 'quotes:print', 'quotes:export',
    'products:create', 'products:read', 'products:update',
    'inventory:read', 'inventory:update', 'inventory:adjust', 'inventory:view_costs', 'inventory:export',
    'services:create', 'services:read', 'services:update',
    'suppliers:read', 'purchases:read',
    'preventive:create', 'preventive:read', 'preventive:update',
    'schedule:read', 'schedule:update', 'schedule:manage',
    'reports:read', 'reports:export',
    'admin:view_audit',
  ]);

  // Recepcionista
  await assignPermissions(IDS.roleReceptionist, [
    'clients:create', 'clients:read', 'clients:update',
    'assets:create', 'assets:read', 'assets:update',
    'work_orders:create', 'work_orders:read', 'work_orders:update', 'work_orders:sign', 'work_orders:print',
    'quotes:create', 'quotes:read', 'quotes:update', 'quotes:send', 'quotes:print',
    'products:read', 'inventory:read',
    'services:read',
    'schedule:read',
  ]);

  // Técnico (solo sus OT)
  await assignPermissions(IDS.roleTechnician, [
    'clients:read', 'assets:read',
    'work_orders:read', 'work_orders:update', 'work_orders:close', 'work_orders:sign', 'work_orders:print',
    'quotes:read',
    'products:read', 'inventory:read',
    'services:read',
    'schedule:read',
  ], { own_only: true });

  // Técnico Terreno
  await assignPermissions(IDS.roleFieldTechnician, [
    'clients:read', 'assets:read',
    'work_orders:read', 'work_orders:update', 'work_orders:close', 'work_orders:sign', 'work_orders:print',
    'quotes:read',
    'products:read', 'inventory:read',
    'services:read',
    'schedule:read',
    'field_service:read', 'field_service:update',
  ], { own_only: true });

  // Vendedor
  await assignPermissions(IDS.roleSalesperson, [
    'clients:create', 'clients:read', 'clients:update', 'clients:export',
    'assets:read',
    'work_orders:create', 'work_orders:read', 'work_orders:print',
    'quotes:create', 'quotes:read', 'quotes:update', 'quotes:send', 'quotes:print', 'quotes:export',
    'products:read', 'services:read',
    'schedule:read',
    'reports:read',
  ]);

  // Bodega
  await assignPermissions(IDS.roleWarehouse, [
    'products:create', 'products:read', 'products:update', 'products:export', 'products:import',
    'inventory:read', 'inventory:update', 'inventory:adjust', 'inventory:view_costs', 'inventory:export', 'inventory:import',
    'suppliers:create', 'suppliers:read', 'suppliers:update', 'suppliers:export',
    'purchases:create', 'purchases:read', 'purchases:update', 'purchases:receive', 'purchases:export',
    'work_orders:read',
  ]);

  // Supervisor
  await assignPermissions(IDS.roleSupervisor, [
    'clients:read', 'clients:export',
    'assets:read', 'assets:export',
    'work_orders:read', 'work_orders:assign', 'work_orders:close', 'work_orders:approve',
    'work_orders:view_costs', 'work_orders:print', 'work_orders:export',
    'quotes:read', 'quotes:approve', 'quotes:view_costs', 'quotes:print', 'quotes:export',
    'products:read', 'inventory:read', 'inventory:view_costs', 'inventory:export',
    'services:read',
    'suppliers:read', 'purchases:read',
    'preventive:read',
    'schedule:read',
    'reports:read', 'reports:export',
    'admin:view_audit',
  ]);

  // Cliente Portal (acceso muy limitado)
  await assignPermissions(IDS.roleClientPortal, [
    'portal:read',
  ]);

  console.log('   ✅ Permisos asignados a roles');
}

// ---------------------------------------------------------------------------
// 5. Tenant demo
// ---------------------------------------------------------------------------
async function seedTenantDemo() {
  console.log('🏢 Seeding tenant demo...');

  await prisma.tenant.upsert({
    where: { slug: 'demo-taller' },
    update: { name: 'Demo Taller' },
    create: {
      id: IDS.tenantDemo,
      name: 'Demo Taller',
      slug: 'demo-taller',
      legalName: 'Demo Taller SpA',
      taxId: '76.123.456-7',
      email: 'admin@demotaller.cl',
      phone: '+56912345678',
      address: 'Av. Providencia 1234, Santiago',
      country: 'CL',
      currency: 'CLP',
      timezone: 'America/Santiago',
      primaryColor: '#2563EB',
      planId: IDS.planBusiness,
      status: 'active',
      settings: {
        taxRate: 19, // IVA Chile
        orderNumberPrefix: 'OT',
        quoteNumberPrefix: 'COT',
        purchaseNumberPrefix: 'OC',
        dateFormat: 'DD/MM/YYYY',
        workingHours: { start: '09:00', end: '18:00' },
      },
    },
  });

  console.log('   ✅ Tenant demo creado');
}

// ---------------------------------------------------------------------------
// 6. Sucursal demo
// ---------------------------------------------------------------------------
async function seedBranchDemo() {
  console.log('🏪 Seeding sucursal demo...');

  await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: IDS.tenantDemo, code: 'MAIN' } },
    update: { name: 'Sucursal Principal' },
    create: {
      id: IDS.branchDemo,
      tenantId: IDS.tenantDemo,
      name: 'Sucursal Principal',
      code: 'MAIN',
      address: 'Av. Providencia 1234, Santiago',
      phone: '+56912345678',
      email: 'admin@demotaller.cl',
      isMain: true,
      isActive: true,
      settings: {},
    },
  });

  console.log('   ✅ Sucursal demo creada');
}

// ---------------------------------------------------------------------------
// 7. Usuario admin demo
// ---------------------------------------------------------------------------
async function seedAdminUser() {
  console.log('👤 Seeding usuario admin demo...');

  // Password: "Admin123!"
  // NOTA: En producción, cambiar esta contraseña inmediatamente
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@demotaller.cl' },
    update: {
      passwordHash,
      isActive: true,
      roleId: IDS.roleOwner,
    },
    create: {
      id: IDS.userAdmin,
      tenantId: IDS.tenantDemo,
      email: 'admin@demotaller.cl',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Demo',
      phone: '+56912345678',
      roleId: IDS.roleOwner,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Asignar a sucursal
  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: IDS.userAdmin, branchId: IDS.branchDemo } },
    update: {},
    create: {
      userId: IDS.userAdmin,
      branchId: IDS.branchDemo,
      isDefault: true,
    },
  });

  console.log('   ✅ Usuario admin demo creado (admin@demotaller.cl / Admin123!)');
}

// ---------------------------------------------------------------------------
// 8. Estados de orden de trabajo iniciales
// ---------------------------------------------------------------------------
async function seedWorkOrderStatuses() {
  console.log('📋 Seeding estados de OT...');

  const statuses = [
    { code: 'ingresada', name: 'Ingresada', color: '#3B82F6', sortOrder: 1, isInitial: true, isFinal: false },
    { code: 'en_revision', name: 'En Revisión', color: '#8B5CF6', sortOrder: 2, isInitial: false, isFinal: false },
    { code: 'pendiente_aprobacion', name: 'Pendiente Aprobación', color: '#F59E0B', sortOrder: 3, isInitial: false, isFinal: false },
    { code: 'aprobada', name: 'Aprobada', color: '#10B981', sortOrder: 4, isInitial: false, isFinal: false },
    { code: 'esperando_repuesto', name: 'Esperando Repuesto', color: '#F97316', sortOrder: 5, isInitial: false, isFinal: false },
    { code: 'en_reparacion', name: 'En Reparación', color: '#6366F1', sortOrder: 6, isInitial: false, isFinal: false },
    { code: 'lista_entrega', name: 'Lista para Entrega', color: '#14B8A6', sortOrder: 7, isInitial: false, isFinal: false },
    { code: 'entregada', name: 'Entregada', color: '#22C55E', sortOrder: 8, isInitial: false, isFinal: true },
    { code: 'cancelada', name: 'Cancelada', color: '#EF4444', sortOrder: 9, isInitial: false, isFinal: true },
    { code: 'garantia', name: 'Garantía', color: '#EC4899', sortOrder: 10, isInitial: false, isFinal: false },
    { code: 'chequeo', name: 'Chequeo', color: '#94A3B8', sortOrder: 11, isInitial: false, isFinal: false },
    { code: 'sin_estado', name: 'Sin estado', color: '#94A3B8', sortOrder: 12, isInitial: false, isFinal: false },
    { code: 'esperando_respuesta', name: 'Esperando respuesta', color: '#F59E0B', sortOrder: 13, isInitial: false, isFinal: false },
    { code: 'reparacion', name: 'Reparación', color: '#6366F1', sortOrder: 14, isInitial: false, isFinal: false },
    { code: 'cambio', name: 'Cambio', color: '#14B8A6', sortOrder: 15, isInitial: false, isFinal: false },
    { code: 'instalado', name: 'Instalado', color: '#10B981', sortOrder: 16, isInitial: false, isFinal: false },
    { code: 'no_presento_falla', name: 'No presentó falla', color: '#F59E0B', sortOrder: 17, isInitial: false, isFinal: false },
    { code: 'no_reparado', name: 'No reparado', color: '#EF4444', sortOrder: 18, isInitial: false, isFinal: false },
    { code: 'reparado', name: 'Reparado', color: '#22C55E', sortOrder: 19, isInitial: false, isFinal: false },
    { code: 'retenido', name: 'Retenido', color: '#A855F7', sortOrder: 20, isInitial: false, isFinal: false },
    { code: 'sin_solucion', name: 'Sin solución', color: '#64748B', sortOrder: 21, isInitial: false, isFinal: false },
  ];

  for (const status of statuses) {
    await prisma.workOrderStatus.upsert({
      where: { tenantId_code: { tenantId: IDS.tenantDemo, code: status.code } },
      update: { name: status.name, color: status.color, sortOrder: status.sortOrder },
      create: {
        tenantId: IDS.tenantDemo,
        ...status,
        isSystem: true,
      },
    });
  }

  console.log('   ✅ Estados de OT creados');
}

// ---------------------------------------------------------------------------
// 9. Categorías de productos base
// ---------------------------------------------------------------------------
async function seedProductCategories() {
  console.log('📦 Seeding categorías de productos...');

  const categories = [
    { name: 'Repuestos', slug: 'repuestos', sortOrder: 1 },
    { name: 'Accesorios', slug: 'accesorios', sortOrder: 2 },
    { name: 'Consumibles', slug: 'consumibles', sortOrder: 3 },
    { name: 'Cables y Conectores', slug: 'cables-conectores', sortOrder: 4 },
    { name: 'Baterías', slug: 'baterias', sortOrder: 5 },
    { name: 'Pantallas', slug: 'pantallas', sortOrder: 6 },
    { name: 'Componentes Electrónicos', slug: 'componentes-electronicos', sortOrder: 7 },
    { name: 'Herramientas', slug: 'herramientas', sortOrder: 8 },
  ];

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { tenantId_slug: { tenantId: IDS.tenantDemo, slug: cat.slug } },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: {
        tenantId: IDS.tenantDemo,
        ...cat,
        isActive: true,
      },
    });
  }

  console.log('   ✅ Categorías de productos creadas');
}

// ---------------------------------------------------------------------------
// 10. Tipos de activos base
// ---------------------------------------------------------------------------
async function seedAssetTypes() {
  console.log('🖥️  Seeding tipos de activos...');

  const types = [
    { name: 'Computador Desktop', icon: 'monitor', fieldsSchema: { fields: ['procesador', 'ram', 'disco', 'sistema_operativo'] } },
    { name: 'Notebook', icon: 'laptop', fieldsSchema: { fields: ['procesador', 'ram', 'disco', 'tamaño_pantalla', 'sistema_operativo'] } },
    { name: 'Celular', icon: 'smartphone', fieldsSchema: { fields: ['imei', 'almacenamiento', 'sistema_operativo'] } },
    { name: 'Tablet', icon: 'tablet', fieldsSchema: { fields: ['almacenamiento', 'tamaño_pantalla', 'sistema_operativo'] } },
    { name: 'Consola de Videojuegos', icon: 'gamepad', fieldsSchema: { fields: ['almacenamiento', 'version_firmware'] } },
    { name: 'Impresora', icon: 'printer', fieldsSchema: { fields: ['tipo_impresion', 'conectividad'] } },
    { name: 'Audio Profesional', icon: 'music', fieldsSchema: { fields: ['tipo_equipo', 'potencia', 'impedancia'] } },
    { name: 'Iluminación', icon: 'lightbulb', fieldsSchema: { fields: ['tipo_lampara', 'potencia', 'voltaje'] } },
    { name: 'Electrodoméstico', icon: 'home', fieldsSchema: { fields: ['tipo', 'voltaje', 'potencia'] } },
    { name: 'Automóvil', icon: 'car', fieldsSchema: { fields: ['motor', 'transmision', 'combustible'] } },
    { name: 'Motocicleta', icon: 'bike', fieldsSchema: { fields: ['cilindrada', 'combustible'] } },
    { name: 'Otro', icon: 'box', fieldsSchema: { fields: [] } },
  ];

  for (const type of types) {
    // Upsert by name since we don't have a unique constraint on name per tenant
    const existing = await prisma.assetType.findFirst({
      where: { tenantId: IDS.tenantDemo, name: type.name },
    });

    if (!existing) {
      await prisma.assetType.create({
        data: {
          tenantId: IDS.tenantDemo,
          name: type.name,
          icon: type.icon,
          fieldsSchema: type.fieldsSchema,
          isActive: true,
        },
      });
    }
  }

  console.log('   ✅ Tipos de activos creados');
}

// ---------------------------------------------------------------------------
// 11. Plantillas de notificación base
// ---------------------------------------------------------------------------
async function seedNotificationTemplates() {
  console.log('📧 Seeding plantillas de notificación...');

  const templates = [
    {
      event: 'work_order.created',
      channel: 'email' as const,
      subject: 'Orden de Trabajo #{{order.number}} creada',
      body: `Estimado/a {{customer.name}},

Le informamos que se ha creado la orden de trabajo #{{order.number}} para su equipo {{asset.brand}} {{asset.model}}.

Puede hacer seguimiento del estado en nuestro portal de clientes.

Saludos,
{{tenant.name}}`,
    },
    {
      event: 'work_order.status_changed',
      channel: 'email' as const,
      subject: 'Actualización de su OT #{{order.number}}',
      body: `Estimado/a {{customer.name}},

Su orden de trabajo #{{order.number}} ha cambiado de estado a: {{order.status}}.

{{#if order.client_notes}}
Nota: {{order.client_notes}}
{{/if}}

Puede consultar el detalle en nuestro portal de clientes.

Saludos,
{{tenant.name}}`,
    },
    {
      event: 'work_order.ready',
      channel: 'email' as const,
      subject: '¡Su equipo está listo! OT #{{order.number}}',
      body: `Estimado/a {{customer.name}},

Nos complace informarle que su equipo {{asset.brand}} {{asset.model}} está listo para ser retirado.

Orden: #{{order.number}}
Sucursal: {{branch.name}}
Dirección: {{branch.address}}
Horario: Lunes a Viernes, 9:00 - 18:00

Total a pagar: {{order.total}}

Saludos,
{{tenant.name}}`,
    },
    {
      event: 'quote.sent',
      channel: 'email' as const,
      subject: 'Cotización #{{quote.number}} — {{tenant.name}}',
      body: `Estimado/a {{customer.name}},

Adjuntamos la cotización #{{quote.number}} solicitada.

Total: {{quote.total}}
Válida hasta: {{quote.valid_until}}

Puede aprobar o rechazar esta cotización directamente desde el siguiente enlace:
{{quote.approval_link}}

Saludos,
{{tenant.name}}`,
    },
    {
      event: 'quote.approved',
      channel: 'email' as const,
      subject: 'Cotización #{{quote.number}} aprobada',
      body: `La cotización #{{quote.number}} ha sido aprobada por {{customer.name}}.

Aprobada el: {{quote.approved_at}}

Proceder con la orden de trabajo correspondiente.`,
    },
    {
      event: 'preventive.due_soon',
      channel: 'email' as const,
      subject: 'Mantenimiento preventivo próximo — {{asset.brand}} {{asset.model}}',
      body: `Estimado/a {{customer.name}},

Le recordamos que su equipo {{asset.brand}} {{asset.model}} tiene un mantenimiento preventivo programado para el {{preventive.next_due_at}}.

Plan: {{preventive.name}}

Le recomendamos agendar su cita lo antes posible.

Saludos,
{{tenant.name}}`,
    },
    {
      event: 'work_order.created',
      channel: 'whatsapp' as const,
      subject: null,
      body: `🔧 *{{tenant.name}}*\n\nHola {{customer.name}}, se ha creado la OT #{{order.number}} para su {{asset.brand}} {{asset.model}}.\n\nLe mantendremos informado del avance.`,
    },
    {
      event: 'work_order.ready',
      channel: 'whatsapp' as const,
      subject: null,
      body: `✅ *{{tenant.name}}*\n\n¡Hola {{customer.name}}! Su equipo está listo para retiro.\n\nOT: #{{order.number}}\nTotal: {{order.total}}\n\n📍 {{branch.address}}`,
    },
  ];

  for (const tpl of templates) {
    const existing = await prisma.notificationTemplate.findFirst({
      where: {
        tenantId: null, // Templates de plataforma
        event: tpl.event,
        channel: tpl.channel,
      },
    });

    if (!existing) {
      await prisma.notificationTemplate.create({
        data: {
          tenantId: null, // Templates globales de plataforma
          event: tpl.event,
          channel: tpl.channel,
          subject: tpl.subject,
          body: tpl.body,
          isActive: true,
        },
      });
    }
  }

  console.log('   ✅ Plantillas de notificación creadas');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('');
  console.log('🚀 TallerHub — Seed de datos base');
  console.log('══════════════════════════════════════════');

  // Orden importa: planes → tenant → roles → permisos → asignación → usuario → resto
  await seedPlans();
  await seedTenantDemo();
  await seedPermissions();
  await seedRoles();
  await seedRolePermissions();
  await seedBranchDemo();
  await seedAdminUser();
  await seedWorkOrderStatuses();
  await seedProductCategories();
  await seedAssetTypes();
  await seedNotificationTemplates();

  console.log('');
  console.log('══════════════════════════════════════════');
  console.log('✅ Seed completado exitosamente');
  console.log('');
  console.log('📌 Credenciales de acceso:');
  console.log('   Email:    admin@demotaller.cl');
  console.log('   Password: Admin123!');
  console.log('   Tenant:   Demo Taller (demo-taller)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
