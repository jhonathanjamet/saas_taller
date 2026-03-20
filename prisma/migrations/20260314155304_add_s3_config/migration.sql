-- CreateTable
CREATE TABLE "s3_config" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "access_key_id" VARCHAR(200) NOT NULL,
    "secret_access_key" VARCHAR(200) NOT NULL,
    "bucket" VARCHAR(200) NOT NULL,
    "region" VARCHAR(100),
    "endpoint" VARCHAR(300),
    "base_path" VARCHAR(200),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "s3_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "s3_config_tenant_id_key" ON "s3_config"("tenant_id");

-- AddForeignKey
ALTER TABLE "s3_config" ADD CONSTRAINT "s3_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
