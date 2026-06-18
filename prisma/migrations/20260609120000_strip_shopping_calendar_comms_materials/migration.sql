-- DropForeignKey
ALTER TABLE "Communication" DROP CONSTRAINT "Communication_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Communication" DROP CONSTRAINT "Communication_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Communication" DROP CONSTRAINT "Communication_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobMaterial" DROP CONSTRAINT "JobMaterial_jobId_fkey";

-- DropTable
DROP TABLE "Communication";

-- DropTable
DROP TABLE "JobMaterial";

-- DropEnum
DROP TYPE "CommunicationType";

-- DropEnum
DROP TYPE "MaterialStatus";

