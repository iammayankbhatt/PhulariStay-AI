CREATE TABLE IF NOT EXISTS "RoomAvailabilityOverride" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "availableRooms" INTEGER NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoomAvailabilityOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RoomAvailabilityOverride_roomId_date_key" ON "RoomAvailabilityOverride"("roomId", "date");
CREATE INDEX IF NOT EXISTS "RoomAvailabilityOverride_roomId_idx" ON "RoomAvailabilityOverride"("roomId");
CREATE INDEX IF NOT EXISTS "RoomAvailabilityOverride_date_idx" ON "RoomAvailabilityOverride"("date");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RoomAvailabilityOverride_roomId_fkey'
  ) THEN
    ALTER TABLE "RoomAvailabilityOverride"
      ADD CONSTRAINT "RoomAvailabilityOverride_roomId_fkey"
      FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
