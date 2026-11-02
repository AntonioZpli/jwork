ALTER TABLE "Application" ADD COLUMN "candidateHiddenAt" TIMESTAMP(3);

CREATE INDEX "Application_candidateProfileId_candidateHiddenAt_idx"
ON "Application"("candidateProfileId", "candidateHiddenAt");
