-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "boolValue" BOOLEAN,
    "stringValue" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);
