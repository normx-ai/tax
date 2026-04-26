-- Bloc 4.3 — Documents joints aux dossiers (metadata)
-- L'upload effectif (multer / S3) suivra dans une iteration ulterieure.

-- CreateTable
CREATE TABLE "dossier_documents" (
  "id" TEXT NOT NULL,
  "dossierId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "storedPath" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "uploadedById" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dossier_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dossier_documents_dossierId_idx" ON "dossier_documents"("dossierId");
CREATE INDEX "dossier_documents_uploadedById_idx" ON "dossier_documents"("uploadedById");

-- AddForeignKey
ALTER TABLE "dossier_documents" ADD CONSTRAINT "dossier_documents_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
