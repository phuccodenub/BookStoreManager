-- CreateTable
CREATE TABLE "system_configs" (
    "id" VARCHAR(40) NOT NULL DEFAULT 'default',
    "store_name" VARCHAR(200) NOT NULL,
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(20),
    "contact_address" VARCHAR(300),
    "shipping_fee" DECIMAL(12,0) NOT NULL DEFAULT 25000,
    "support_hours" VARCHAR(200),
    "payment_provider_name" VARCHAR(120),
    "payment_instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);
