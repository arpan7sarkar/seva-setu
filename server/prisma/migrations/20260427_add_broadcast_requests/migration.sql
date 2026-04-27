-- CreateTable: broadcast_requests for Automated Volunteer Dispatch
CREATE TABLE "broadcast_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "need_id" UUID NOT NULL,
    "volunteer_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "distance_km" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broadcast_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_requests_need_id_volunteer_id_key" ON "broadcast_requests"("need_id", "volunteer_id");
CREATE INDEX "broadcast_requests_volunteer_id_status_idx" ON "broadcast_requests"("volunteer_id", "status");
CREATE INDEX "broadcast_requests_need_id_status_idx" ON "broadcast_requests"("need_id", "status");

-- AddForeignKey
ALTER TABLE "broadcast_requests" ADD CONSTRAINT "broadcast_requests_need_id_fkey" FOREIGN KEY ("need_id") REFERENCES "needs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "broadcast_requests" ADD CONSTRAINT "broadcast_requests_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
