# 🔧 TallerHub — Herramientas de Migración desde Gestioo

Scripts para importar datos exportados desde Gestioo hacia TallerHub.

## Entidades soportadas

| Entidad | Archivo CSV | Descripción |
|---------|-------------|-------------|
| **Clientes** | `clientes.csv` | Personas y empresas |
| **Activos** | `activos.csv` | Equipos, vehículos, dispositivos |
| **Productos** | `productos.csv` | Repuestos e inventario |
| **Órdenes** | `ordenes.csv` | Órdenes de trabajo |

## Requisitos previos

1. **Node.js ≥ 18** y **npm** instalados
2. **Base de datos TallerHub** configurada con esquema migrado (`prisma migrate deploy`)
3. **Seed ejecutado** para tener roles, estados y categorías base (`prisma db seed`)
4. **Archivos CSV** exportados desde Gestioo

## Instalación

```bash
cd migration-tools

# Instalar dependencias
npm install

# Generar cliente Prisma (usa el schema del proyecto padre)
npx prisma generate --schema=../prisma/schema.prisma

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus datos reales
```

## Configuración (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tallerhub"
TENANT_ID="uuid-del-tenant"           # ID del taller destino
BRANCH_ID="uuid-de-la-sucursal"       # ID de la sucursal principal
MIGRATION_USER_ID="uuid-del-admin"    # Usuario que ejecuta la migración
CSV_DIR="./samples"                    # Carpeta con los CSV
DRY_RUN=false                          # true = solo validar sin escribir
LOG_LEVEL=info                         # debug | info | warn | error
```

> **Tip:** Para obtener los UUIDs, usa `npx prisma studio` en el proyecto principal y consulta las tablas `tenant`, `branch` y `user`.

## Uso

### Importar todo (orden correcto automático)
```bash
npm run migrate
```

### Importar solo una entidad
```bash
npm run migrate:customers
npm run migrate:assets
npm run migrate:products
npm run migrate:orders
```

### Modo validación (sin escribir en BD)
```bash
npm run validate
# o
npm run migrate:dry-run
```

### Con argumentos directos
```bash
npx ts-node src/import.ts --entity customers --dry-run
```

## Formato de archivos CSV

### `clientes.csv`

| Columna | Obligatorio | Descripción |
|---------|:-----------:|-------------|
| `nombre` | ✅ | Nombre / Razón social |
| `apellido` | | Apellido |
| `razon_social` | | Razón social (empresas) |
| `rut` | | RUT/NIF del cliente |
| `email` | | Email de contacto |
| `telefono` | | Teléfono principal |
| `telefono2` | | Teléfono secundario |
| `direccion` | | Dirección |
| `ciudad` | | Ciudad |
| `region` | | Región/Estado |
| `tipo` | | `persona` o `empresa` |
| `notas` | | Notas adicionales |

### `activos.csv`

| Columna | Obligatorio | Descripción |
|---------|:-----------:|-------------|
| `cliente_rut` | ⚡ | RUT del dueño |
| `cliente_email` | ⚡ | Email del dueño |
| `cliente_nombre` | ⚡ | Nombre del dueño |
| `tipo` | | Tipo de activo (Automóvil, Notebook, etc.) |
| `marca` | ⚡⚡ | Marca |
| `modelo` | ⚡⚡ | Modelo |
| `serial` | ⚡⚡ | Número de serie |
| `patente` | | Patente (vehículos) |
| `anio` | | Año de fabricación |
| `color` | | Color |
| `kilometraje` | | Kilometraje/horas de uso |
| `accesorios` | | Accesorios incluidos |
| `condicion` | | Condición visual |
| `notas` | | Notas |

> ⚡ Se requiere al menos uno de los campos de cliente.
> ⚡⚡ Se requiere al menos uno entre marca, modelo o serial.

### `productos.csv`

| Columna | Obligatorio | Descripción |
|---------|:-----------:|-------------|
| `nombre` | ✅ | Nombre del producto |
| `sku` | | Código SKU |
| `codigo_barras` | | Código de barras |
| `descripcion` | | Descripción |
| `categoria` | | Nombre de categoría existente |
| `unidad` | | Unidad de medida (default: unidad) |
| `costo` | | Costo unitario |
| `precio` | | Precio de venta |
| `precio_mayorista` | | Precio mayorista |
| `stock_minimo` | | Stock mínimo de alerta |
| `stock_actual` | | Stock actual (crea inventario inicial) |
| `ubicacion` | | Ubicación física |
| `impuesto` | | % de impuesto (default: 19) |

### `ordenes.csv`

| Columna | Obligatorio | Descripción |
|---------|:-----------:|-------------|
| `numero_orden` | ✅ | Número de orden único |
| `cliente_rut` | ⚡ | RUT del cliente |
| `cliente_email` | ⚡ | Email del cliente |
| `cliente_nombre` | ⚡ | Nombre del cliente |
| `activo_serial` | | Serial del activo |
| `activo_patente` | | Patente del activo |
| `tipo` | | Tipo (reparacion, mantenimiento, diagnostico) |
| `prioridad` | | baja, media, alta, urgente |
| `estado` | | Código del estado en TallerHub |
| `diagnostico_inicial` | | Diagnóstico inicial |
| `diagnostico_tecnico` | | Diagnóstico técnico |
| `notas_internas` | | Notas internas |
| `notas_cliente` | | Notas para el cliente |
| `fecha_ingreso` | | DD/MM/YYYY o YYYY-MM-DD |
| `fecha_prometida` | | Fecha prometida |
| `fecha_completado` | | Fecha completado |
| `fecha_entrega` | | Fecha de entrega |
| `subtotal_productos` | | Subtotal productos |
| `subtotal_servicios` | | Subtotal servicios |
| `descuento` | | Monto descuento |
| `impuesto` | | Monto impuesto |
| `total` | | Monto total |

## Orden de importación

El script respeta automáticamente el siguiente orden para resolver dependencias:

```
1. Clientes  →  (independiente)
2. Activos   →  depende de Clientes
3. Productos →  (independiente)
4. Órdenes   →  depende de Clientes y Activos
```

## Validaciones

- **Nombres obligatorios** en clientes y productos
- **Formato de email** válido
- **Formato de RUT** chileno
- **Formato de teléfono** básico
- **Detección de duplicados** por email, RUT, SKU, serial, número de orden
- **Resolución de referencias** cruzadas (cliente ↔ activo ↔ orden)
- **Valores numéricos** válidos para precios y cantidades

## Logs

Los logs se generan en `./logs/` con el formato:

```
logs/
├── customers_2024-01-15T10-30-00-000Z.log          # Log completo
├── customers_2024-01-15T10-30-00-000Z_errors.log    # Solo errores
├── assets_2024-01-15T10-30-05-000Z.log
├── assets_2024-01-15T10-30-05-000Z_errors.log
└── ...
```

Al finalizar cada entidad se muestra un resumen:

```
====================================
  RESUMEN DE MIGRACIÓN
====================================
  Total procesados: 150
  Importados OK:    142
  Omitidos:         5
  Errores:          3
====================================
```

## Exportar desde Gestioo

1. En Gestioo, ve a cada sección (Clientes, Equipos, Productos, Órdenes)
2. Usa la opción **Exportar** o **Descargar CSV**
3. Renombra los archivos según la convención: `clientes.csv`, `activos.csv`, `productos.csv`, `ordenes.csv`
4. Si los nombres de columna no coinciden exactamente, ajusta los headers del CSV para que coincidan con los documentados arriba
5. Coloca los archivos en la carpeta `./samples/` (o la que configures en `CSV_DIR`)

## Solución de problemas

| Problema | Solución |
|----------|----------|
| `Archivo CSV no encontrado` | Verifica que el archivo existe en `CSV_DIR` y tiene el nombre correcto |
| `Faltan variables de entorno` | Copia `.env.example` a `.env` y completa los valores |
| `Cliente no encontrado` (en activos/órdenes) | Importa clientes primero, o verifica que los RUT/email coincidan |
| `Unique constraint` | El registro ya existe en la BD. Limpia la BD o usa UUIDs diferentes |
| Encoding incorrecto | Asegúrate de que los CSV estén en UTF-8 (Gestioo suele exportar en este formato) |

## Estructura del proyecto

```
migration-tools/
├── src/
│   ├── import.ts              # Script principal
│   ├── parsers/
│   │   ├── index.ts
│   │   ├── customer-parser.ts # Parser de clientes
│   │   ├── asset-parser.ts    # Parser de activos
│   │   ├── product-parser.ts  # Parser de productos
│   │   └── order-parser.ts    # Parser de órdenes
│   ├── validators/
│   │   └── index.ts           # Validaciones por entidad
│   └── utils/
│       ├── config.ts          # Configuración y args
│       ├── csv-reader.ts      # Lector CSV con helpers
│       └── logger.ts          # Logger con archivos y stats
├── samples/                   # CSVs de ejemplo
├── logs/                      # Logs de importación (gitignored)
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```
