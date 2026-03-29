-- AlterTable
ALTER TABLE "EventType" ADD COLUMN "questions" JSONB;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "answers" JSONB;

-- CreateTable
CREATE TABLE "DateOverride" (
    "id" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "isUnavailable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DateOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DateOverride_eventTypeId_date_key" ON "DateOverride"("eventTypeId", "date");
CREATE INDEX "DateOverride_eventTypeId_idx" ON "DateOverride"("eventTypeId");

ALTER TABLE "DateOverride" ADD CONSTRAINT "DateOverride_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
