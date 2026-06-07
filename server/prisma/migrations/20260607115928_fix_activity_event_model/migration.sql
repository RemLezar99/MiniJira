/*
  Warnings:

  - You are about to drop the column `eventType` on the `ActivityEvent` table. All the data in the column will be lost.
  - Added the required column `type` to the `ActivityEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ActivityEvent" DROP COLUMN "eventType",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "targetUserId" TEXT,
ADD COLUMN     "type" "ActivityEventType" NOT NULL;

-- CreateIndex
CREATE INDEX "ActivityEvent_projectId_createdAt_idx" ON "ActivityEvent"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_issueId_createdAt_idx" ON "ActivityEvent"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_actorId_idx" ON "ActivityEvent"("actorId");

-- CreateIndex
CREATE INDEX "ActivityEvent_targetUserId_idx" ON "ActivityEvent"("targetUserId");
