-- CreateTable
CREATE TABLE "EventType" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventType_slug_key" ON "EventType"("slug");

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Availability_eventTypeId_idx" ON "Availability"("eventTypeId");

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Booking_eventTypeId_date_startTime_key" ON "Booking"("eventTypeId", "date", "startTime");

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
