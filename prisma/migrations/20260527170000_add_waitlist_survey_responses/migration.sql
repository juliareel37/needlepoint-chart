-- CreateTable
CREATE TABLE "WaitlistSurveyResponse" (
    "id" TEXT NOT NULL,
    "waitlistApplicationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "currentTools" TEXT NOT NULL,
    "freeformResponse" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistSurveyResponse_waitlistApplicationId_createdAt_idx" ON "WaitlistSurveyResponse"("waitlistApplicationId", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistSurveyResponse_email_idx" ON "WaitlistSurveyResponse"("email");

-- CreateIndex
CREATE INDEX "WaitlistSurveyResponse_createdAt_idx" ON "WaitlistSurveyResponse"("createdAt");

-- AddForeignKey
ALTER TABLE "WaitlistSurveyResponse" ADD CONSTRAINT "WaitlistSurveyResponse_waitlistApplicationId_fkey" FOREIGN KEY ("waitlistApplicationId") REFERENCES "WaitlistApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
