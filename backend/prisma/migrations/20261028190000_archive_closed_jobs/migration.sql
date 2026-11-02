ALTER TABLE "Job" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Job_companyProfileId_archivedAt_createdAt_idx" ON "Job"("companyProfileId", "archivedAt", "createdAt");
