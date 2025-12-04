-- CreateTable
CREATE TABLE "ai_request_logs" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT,
    "request_json" JSONB NOT NULL,
    "response_json" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_tokens" INTEGER NOT NULL,
    "completion_tokens" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "estimated_price" DECIMAL(10,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_request_logs_user_id_idx" ON "ai_request_logs"("user_id");

-- CreateIndex
CREATE INDEX "ai_request_logs_created_at_idx" ON "ai_request_logs"("created_at");

-- CreateIndex
CREATE INDEX "ai_request_logs_model_idx" ON "ai_request_logs"("model");

-- AddForeignKey
ALTER TABLE "ai_request_logs" ADD CONSTRAINT "ai_request_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
