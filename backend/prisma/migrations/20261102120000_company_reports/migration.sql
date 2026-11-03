ALTER TYPE "ReportTargetType" ADD VALUE IF NOT EXISTS 'COMPANY';
ALTER TYPE "ReportStatus" RENAME VALUE 'DISMISSED' TO 'REJECTED';

ALTER TABLE "Report" ADD COLUMN "targetCompanyId" UUID;

ALTER TABLE "Report"
ADD CONSTRAINT "Report_targetCompanyId_fkey"
FOREIGN KEY ("targetCompanyId") REFERENCES "CompanyProfile"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Report_targetCompanyId_status_idx" ON "Report"("targetCompanyId", "status");

CREATE UNIQUE INDEX "Report_pending_reporter_company_key"
ON "Report"("reporterUserId", "targetCompanyId")
WHERE "targetCompanyId" IS NOT NULL AND "status" = 'PENDING';

CREATE UNIQUE INDEX "Report_pending_reporter_job_key"
ON "Report"("reporterUserId", "targetJobId")
WHERE "targetJobId" IS NOT NULL AND "status" = 'PENDING';
