CREATE TABLE IF NOT EXISTS "CivicReview" (
  "id" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CivicReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CivicReview_reviewerId_targetUserId_key" ON "CivicReview"("reviewerId", "targetUserId");
CREATE INDEX IF NOT EXISTS "CivicReview_targetUserId_idx" ON "CivicReview"("targetUserId");
CREATE INDEX IF NOT EXISTS "CivicReview_reviewerId_idx" ON "CivicReview"("reviewerId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CivicReview_reviewerId_fkey') THEN
    ALTER TABLE "CivicReview"
      ADD CONSTRAINT "CivicReview_reviewerId_fkey"
      FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CivicReview_targetUserId_fkey') THEN
    ALTER TABLE "CivicReview"
      ADD CONSTRAINT "CivicReview_targetUserId_fkey"
      FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
