ALTER TABLE "User" ADD COLUMN "monitoringCodeHash" TEXT;
ALTER TABLE "User" ADD COLUMN "monitoringCodePreview" TEXT;
CREATE UNIQUE INDEX "User_monitoringCodeHash_key" ON "User"("monitoringCodeHash");
