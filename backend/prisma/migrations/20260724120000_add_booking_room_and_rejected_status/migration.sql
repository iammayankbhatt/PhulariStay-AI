ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "roomId" TEXT;

UPDATE "Booking"
SET "roomId" = (
  SELECT "Room"."id"
  FROM "Room"
  WHERE "Room"."homestayId" = "Booking"."homestayId"
  ORDER BY "Room"."price" ASC
  LIMIT 1
)
WHERE "roomId" IS NULL;

ALTER TABLE "Booking" ALTER COLUMN "roomId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Booking_roomId_idx" ON "Booking"("roomId");

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
