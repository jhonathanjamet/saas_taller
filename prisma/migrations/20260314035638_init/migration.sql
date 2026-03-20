-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended', 'trial', 'cancelled');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('person', 'company');

-- CreateEnum
CREATE TYPE "MileageUnit" AS ENUM ('km', 'hours', 'cycles', 'none');

-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "WorkOrderTaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'skipped');

-- CreateEnum
CREATE TYPE "WorkOrderPhotoPhase" AS ENUM ('reception', 'diagnosis', 'repair', 'delivery');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('reception', 'delivery', 'approval');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'converted');

-- CreateEnum
CREATE TYPE "QuoteItemType" AS ENUM ('product', 'service', 'custom');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('purchase_in', 'work_order_out', 'adjustment', 'transfer_in', 'transfer_out', 'return_in', 'initial');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('draft', 'sent', 'partially_received', 'received', 'cancelled');

-- CreateEnum
CREATE TYPE "PreventiveFrequencyType" AS ENUM ('days', 'weeks', 'months', 'kilometers', 'hours');

-- CreateEnum
CREATE TYPE "PreventiveExecutionStatus" AS ENUM ('scheduled', 'overdue', 'in_progress', 'completed', 'skipped');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'push', 'sms', 'whatsapp');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('queued', 'sent', 'delivered', 'failed', 'bounced');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "MobileSyncType" AS ENUM ('full', 'incremental');

-- CreateEnum
CREATE TYPE "MobileSyncDirection" AS ENUM ('upload', 'download');

-- CreateEnum
CREATE TYPE "MobileSyncStatus" AS ENUM ('started', 'completed', 'failed');

-- CreateTable
CREATE TABLE "subscription_plan" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "max_users" INTEGER,
    "max_branches" INTEGER,
    "enabled_modules" JSONB,
    "max_storage_gb" INTEGER,
    "price_monthly" DECIMAL(10,2) NOT NULL,
    "price_yearly" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "legal_name" VARCHAR(255),
    "tax_id" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "address" TEXT,
    "country" VARCHAR(3) NOT NULL DEFAULT 'CL',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CLP',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/Santiago',
    "logo_url" VARCHAR(500),
    "primary_color" VARCHAR(7) DEFAULT '#2563EB',
    "plan_id" UUID NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMP(3),
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50),
    "avatar_url" VARCHAR(500),
    "role_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "email_verified_at" TIMESTAMP(3),
    "refresh_token_hash" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" UUID NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "conditions" JSONB,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_branch" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'person',
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "legal_name" VARCHAR(255),
    "tax_id" VARCHAR(50),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "secondary_phone" VARCHAR(50),
    "address" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "zip_code" VARCHAR(20),
    "country" VARCHAR(3),
    "tags" JSONB,
    "notes" TEXT,
    "source" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contact" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "role" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_portal_access" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "access_code" VARCHAR(20) NOT NULL,
    "password_hash" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_access_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_portal_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_type" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(50),
    "fields_schema" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "asset_type_id" UUID,
    "brand" VARCHAR(100),
    "model" VARCHAR(100),
    "serial_number" VARCHAR(100),
    "license_plate" VARCHAR(20),
    "year" INTEGER,
    "color" VARCHAR(50),
    "mileage" DECIMAL(12,2),
    "mileage_unit" "MileageUnit" NOT NULL DEFAULT 'none',
    "accessories" TEXT,
    "visual_condition" TEXT,
    "qr_code" VARCHAR(100),
    "custom_fields" JSONB,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_photo" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "description" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_status" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "color" VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_initial" BOOLEAN NOT NULL DEFAULT false,
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "order_number" VARCHAR(30) NOT NULL,
    "customer_id" UUID NOT NULL,
    "asset_id" UUID,
    "status_id" UUID NOT NULL,
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'medium',
    "order_type" VARCHAR(50),
    "channel" VARCHAR(50),
    "assigned_to" UUID,
    "received_by" UUID,
    "initial_diagnosis" TEXT,
    "technical_diagnosis" TEXT,
    "internal_notes" TEXT,
    "client_notes" TEXT,
    "warranty_terms" TEXT,
    "warranty_until" DATE,
    "received_at" TIMESTAMP(3),
    "promised_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "subtotal_products" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal_services" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "internal_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "profit_margin" DECIMAL(5,2),
    "quote_id" UUID,
    "parent_order_id" UUID,
    "is_field_service" BOOLEAN NOT NULL DEFAULT false,
    "field_address" TEXT,
    "field_latitude" DECIMAL(10,8),
    "field_longitude" DECIMAL(11,8),
    "field_scheduled_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "work_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_task" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "assigned_to" UUID,
    "estimated_hours" DECIMAL(5,2),
    "actual_hours" DECIMAL(5,2),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" "WorkOrderTaskStatus" NOT NULL DEFAULT 'pending',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_item" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "item_type" VARCHAR(20) NOT NULL,
    "product_id" UUID,
    "service_id" UUID,
    "description" VARCHAR(500),
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "added_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_photo" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "description" VARCHAR(255),
    "phase" "WorkOrderPhotoPhase" NOT NULL DEFAULT 'reception',
    "is_visible_to_client" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_comment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_signature" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "type" "SignatureType" NOT NULL,
    "signer_name" VARCHAR(200) NOT NULL,
    "signer_id_number" VARCHAR(50),
    "signature_url" VARCHAR(500) NOT NULL,
    "signed_at" TIMESTAMP(3) NOT NULL,
    "ip_address" VARCHAR(45),
    "device_info" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "quote_number" VARCHAR(30) NOT NULL,
    "customer_id" UUID NOT NULL,
    "work_order_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "QuoteStatus" NOT NULL DEFAULT 'draft',
    "title" VARCHAR(255),
    "description" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "internal_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "margin_percent" DECIMAL(5,2),
    "valid_until" DATE,
    "approved_at" TIMESTAMP(3),
    "approved_by" VARCHAR(200),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "sent_at" TIMESTAMP(3),
    "sent_via" VARCHAR(50),
    "access_token" VARCHAR(100),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_item" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "itemType" "QuoteItemType" NOT NULL DEFAULT 'custom',
    "product_id" UUID,
    "service_id" UUID,
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_visible_to_client" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_category" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "category_id" UUID,
    "sku" VARCHAR(50),
    "barcode" VARCHAR(50),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "unit" VARCHAR(20) NOT NULL DEFAULT 'unidad',
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "wholesale_price" DECIMAL(12,2),
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "min_stock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "location" VARCHAR(100),
    "image_url" VARCHAR(500),
    "compatible_models" JSONB,
    "is_kit" BOOLEAN NOT NULL DEFAULT false,
    "kit_items" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reserved_quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movement" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "previous_stock" DECIMAL(10,2) NOT NULL,
    "new_stock" DECIMAL(10,2) NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "reason" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estimated_duration_minutes" INTEGER,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "legal_name" VARCHAR(255),
    "tax_id" VARCHAR(50),
    "contact_name" VARCHAR(200),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "address" TEXT,
    "website" VARCHAR(255),
    "notes" TEXT,
    "payment_terms" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "order_number" VARCHAR(30) NOT NULL,
    "supplier_id" UUID NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "additional_costs" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expected_at" DATE,
    "received_at" TIMESTAMP(3),
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_item" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity_ordered" DECIMAL(10,2) NOT NULL,
    "quantity_received" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preventive_plan" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "frequency_type" "PreventiveFrequencyType" NOT NULL,
    "frequency_value" INTEGER NOT NULL,
    "alert_before_value" INTEGER NOT NULL DEFAULT 7,
    "template_tasks" JSONB,
    "template_products" JSONB,
    "template_services" JSONB,
    "last_executed_at" TIMESTAMP(3),
    "next_due_at" TIMESTAMP(3),
    "next_due_mileage" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preventive_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preventive_execution" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "preventive_plan_id" UUID NOT NULL,
    "work_order_id" UUID,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "executed_at" TIMESTAMP(3),
    "status" "PreventiveExecutionStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preventive_execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_template" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "event" VARCHAR(100) NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" VARCHAR(255),
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "template_id" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255),
    "body" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'queued',
    "error_message" TEXT,
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "changes" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_attachment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoint" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "events" JSONB NOT NULL,
    "secret" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMP(3),
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_sync_log" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "sync_type" "MobileSyncType" NOT NULL,
    "direction" "MobileSyncDirection" NOT NULL,
    "entities_synced" JSONB,
    "conflicts" JSONB,
    "status" "MobileSyncStatus" NOT NULL DEFAULT 'started',
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mobile_sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_code_key" ON "subscription_plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_slug_key" ON "tenant"("slug");

-- CreateIndex
CREATE INDEX "tenant_status_idx" ON "tenant"("status");

-- CreateIndex
CREATE INDEX "branch_tenant_id_is_active_idx" ON "branch"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "branch_tenant_id_code_key" ON "branch"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_tenant_id_is_active_idx" ON "user"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "user_tenant_id_role_id_idx" ON "user"("tenant_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_tenant_id_code_key" ON "role"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "permission_module_action_key" ON "permission"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permission_role_id_permission_id_key" ON "role_permission"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_branch_user_id_branch_id_key" ON "user_branch"("user_id", "branch_id");

-- CreateIndex
CREATE INDEX "customer_tenant_id_is_active_idx" ON "customer"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "customer_tenant_id_tax_id_idx" ON "customer"("tenant_id", "tax_id");

-- CreateIndex
CREATE INDEX "customer_tenant_id_email_idx" ON "customer"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "customer_tenant_id_first_name_last_name_idx" ON "customer"("tenant_id", "first_name", "last_name");

-- CreateIndex
CREATE INDEX "customer_contact_tenant_id_customer_id_idx" ON "customer_contact"("tenant_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_portal_access_customer_id_key" ON "customer_portal_access"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_portal_access_tenant_id_access_code_key" ON "customer_portal_access"("tenant_id", "access_code");

-- CreateIndex
CREATE INDEX "asset_type_tenant_id_is_active_idx" ON "asset_type"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "asset_tenant_id_customer_id_idx" ON "asset"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "asset_tenant_id_serial_number_idx" ON "asset"("tenant_id", "serial_number");

-- CreateIndex
CREATE INDEX "asset_tenant_id_license_plate_idx" ON "asset"("tenant_id", "license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "asset_tenant_id_qr_code_key" ON "asset"("tenant_id", "qr_code");

-- CreateIndex
CREATE INDEX "asset_photo_tenant_id_asset_id_idx" ON "asset_photo"("tenant_id", "asset_id");

-- CreateIndex
CREATE INDEX "work_order_status_tenant_id_sort_order_idx" ON "work_order_status"("tenant_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_status_tenant_id_code_key" ON "work_order_status"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "work_order_tenant_id_branch_id_status_id_idx" ON "work_order"("tenant_id", "branch_id", "status_id");

-- CreateIndex
CREATE INDEX "work_order_tenant_id_customer_id_idx" ON "work_order"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "work_order_tenant_id_asset_id_idx" ON "work_order"("tenant_id", "asset_id");

-- CreateIndex
CREATE INDEX "work_order_tenant_id_assigned_to_idx" ON "work_order"("tenant_id", "assigned_to");

-- CreateIndex
CREATE INDEX "work_order_tenant_id_created_at_idx" ON "work_order"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "work_order_tenant_id_promised_at_idx" ON "work_order"("tenant_id", "promised_at");

-- CreateIndex
CREATE INDEX "work_order_tenant_id_is_field_service_idx" ON "work_order"("tenant_id", "is_field_service");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_tenant_id_order_number_key" ON "work_order"("tenant_id", "order_number");

-- CreateIndex
CREATE INDEX "work_order_task_tenant_id_work_order_id_idx" ON "work_order_task"("tenant_id", "work_order_id");

-- CreateIndex
CREATE INDEX "work_order_item_tenant_id_work_order_id_idx" ON "work_order_item"("tenant_id", "work_order_id");

-- CreateIndex
CREATE INDEX "work_order_item_tenant_id_product_id_idx" ON "work_order_item"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "work_order_item_tenant_id_service_id_idx" ON "work_order_item"("tenant_id", "service_id");

-- CreateIndex
CREATE INDEX "work_order_photo_tenant_id_work_order_id_idx" ON "work_order_photo"("tenant_id", "work_order_id");

-- CreateIndex
CREATE INDEX "work_order_photo_tenant_id_work_order_id_is_visible_to_clie_idx" ON "work_order_photo"("tenant_id", "work_order_id", "is_visible_to_client");

-- CreateIndex
CREATE INDEX "work_order_comment_tenant_id_work_order_id_created_at_idx" ON "work_order_comment"("tenant_id", "work_order_id", "created_at");

-- CreateIndex
CREATE INDEX "work_order_signature_tenant_id_work_order_id_idx" ON "work_order_signature"("tenant_id", "work_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "quote_access_token_key" ON "quote"("access_token");

-- CreateIndex
CREATE INDEX "quote_tenant_id_customer_id_idx" ON "quote"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "quote_tenant_id_status_idx" ON "quote"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "quote_tenant_id_quote_number_key" ON "quote"("tenant_id", "quote_number");

-- CreateIndex
CREATE INDEX "quote_item_tenant_id_quote_id_idx" ON "quote_item"("tenant_id", "quote_id");

-- CreateIndex
CREATE INDEX "product_category_tenant_id_parent_id_idx" ON "product_category"("tenant_id", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_category_tenant_id_slug_key" ON "product_category"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "product_tenant_id_barcode_idx" ON "product"("tenant_id", "barcode");

-- CreateIndex
CREATE INDEX "product_tenant_id_category_id_idx" ON "product"("tenant_id", "category_id");

-- CreateIndex
CREATE INDEX "product_tenant_id_is_active_idx" ON "product"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "product_tenant_id_name_idx" ON "product"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_tenant_id_sku_key" ON "product"("tenant_id", "sku");

-- CreateIndex
CREATE INDEX "inventory_tenant_id_branch_id_idx" ON "inventory"("tenant_id", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_tenant_id_product_id_branch_id_key" ON "inventory"("tenant_id", "product_id", "branch_id");

-- CreateIndex
CREATE INDEX "inventory_movement_tenant_id_product_id_created_at_idx" ON "inventory_movement"("tenant_id", "product_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_movement_tenant_id_branch_id_created_at_idx" ON "inventory_movement"("tenant_id", "branch_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_movement_tenant_id_reference_type_reference_id_idx" ON "inventory_movement"("tenant_id", "reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "service_tenant_id_is_active_idx" ON "service"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "supplier_tenant_id_is_active_idx" ON "supplier"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "purchase_order_tenant_id_supplier_id_idx" ON "purchase_order"("tenant_id", "supplier_id");

-- CreateIndex
CREATE INDEX "purchase_order_tenant_id_status_idx" ON "purchase_order"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_tenant_id_order_number_key" ON "purchase_order"("tenant_id", "order_number");

-- CreateIndex
CREATE INDEX "purchase_order_item_tenant_id_purchase_order_id_idx" ON "purchase_order_item"("tenant_id", "purchase_order_id");

-- CreateIndex
CREATE INDEX "purchase_order_item_tenant_id_product_id_idx" ON "purchase_order_item"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "preventive_plan_tenant_id_asset_id_idx" ON "preventive_plan"("tenant_id", "asset_id");

-- CreateIndex
CREATE INDEX "preventive_plan_tenant_id_next_due_at_idx" ON "preventive_plan"("tenant_id", "next_due_at");

-- CreateIndex
CREATE INDEX "preventive_plan_tenant_id_is_active_idx" ON "preventive_plan"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "preventive_execution_tenant_id_preventive_plan_id_idx" ON "preventive_execution"("tenant_id", "preventive_plan_id");

-- CreateIndex
CREATE INDEX "preventive_execution_tenant_id_status_scheduled_at_idx" ON "preventive_execution"("tenant_id", "status", "scheduled_at");

-- CreateIndex
CREATE INDEX "notification_template_tenant_id_event_channel_idx" ON "notification_template"("tenant_id", "event", "channel");

-- CreateIndex
CREATE INDEX "notification_log_tenant_id_created_at_idx" ON "notification_log"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_log_tenant_id_reference_type_reference_id_idx" ON "notification_log"("tenant_id", "reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "notification_log_tenant_id_status_idx" ON "notification_log"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_entity_type_entity_id_idx" ON "audit_log"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_user_id_created_at_idx" ON "audit_log"("tenant_id", "user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_action_created_at_idx" ON "audit_log"("tenant_id", "action", "created_at");

-- CreateIndex
CREATE INDEX "file_attachment_tenant_id_entity_type_entity_id_idx" ON "file_attachment"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "webhook_endpoint_tenant_id_is_active_idx" ON "webhook_endpoint"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "mobile_sync_log_tenant_id_user_id_created_at_idx" ON "mobile_sync_log"("tenant_id", "user_id", "created_at");

-- AddForeignKey
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch" ADD CONSTRAINT "branch_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branch" ADD CONSTRAINT "user_branch_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branch" ADD CONSTRAINT "user_branch_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contact" ADD CONSTRAINT "customer_contact_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contact" ADD CONSTRAINT "customer_contact_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_portal_access" ADD CONSTRAINT "customer_portal_access_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_portal_access" ADD CONSTRAINT "customer_portal_access_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_type" ADD CONSTRAINT "asset_type_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_asset_type_id_fkey" FOREIGN KEY ("asset_type_id") REFERENCES "asset_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset" ADD CONSTRAINT "asset_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_photo" ADD CONSTRAINT "asset_photo_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_photo" ADD CONSTRAINT "asset_photo_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_photo" ADD CONSTRAINT "asset_photo_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_status" ADD CONSTRAINT "work_order_status_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "work_order_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_parent_order_id_fkey" FOREIGN KEY ("parent_order_id") REFERENCES "work_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_task" ADD CONSTRAINT "work_order_task_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_task" ADD CONSTRAINT "work_order_task_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_item" ADD CONSTRAINT "work_order_item_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_item" ADD CONSTRAINT "work_order_item_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_item" ADD CONSTRAINT "work_order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_item" ADD CONSTRAINT "work_order_item_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_item" ADD CONSTRAINT "work_order_item_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_photo" ADD CONSTRAINT "work_order_photo_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_photo" ADD CONSTRAINT "work_order_photo_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_photo" ADD CONSTRAINT "work_order_photo_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_comment" ADD CONSTRAINT "work_order_comment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_comment" ADD CONSTRAINT "work_order_comment_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_comment" ADD CONSTRAINT "work_order_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_signature" ADD CONSTRAINT "work_order_signature_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_signature" ADD CONSTRAINT "work_order_signature_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_item" ADD CONSTRAINT "quote_item_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_item" ADD CONSTRAINT "quote_item_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_item" ADD CONSTRAINT "quote_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_item" ADD CONSTRAINT "quote_item_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_item" ADD CONSTRAINT "purchase_order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preventive_plan" ADD CONSTRAINT "preventive_plan_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preventive_plan" ADD CONSTRAINT "preventive_plan_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preventive_execution" ADD CONSTRAINT "preventive_execution_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preventive_execution" ADD CONSTRAINT "preventive_execution_preventive_plan_id_fkey" FOREIGN KEY ("preventive_plan_id") REFERENCES "preventive_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preventive_execution" ADD CONSTRAINT "preventive_execution_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_template" ADD CONSTRAINT "notification_template_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachment" ADD CONSTRAINT "file_attachment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachment" ADD CONSTRAINT "file_attachment_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_sync_log" ADD CONSTRAINT "mobile_sync_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_sync_log" ADD CONSTRAINT "mobile_sync_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
