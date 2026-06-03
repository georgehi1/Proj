-- CreateEnum
CREATE TYPE "AvailabilityKind" AS ENUM ('AVAILABLE', 'TIME_OFF');

-- CreateTable
CREATE TABLE "ContractorAvailability" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "kind" "AvailabilityKind" NOT NULL DEFAULT 'AVAILABLE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractorAvailability_contractorId_idx" ON "ContractorAvailability"("contractorId");

-- AddForeignKey
ALTER TABLE "ContractorAvailability" ADD CONSTRAINT "ContractorAvailability_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
