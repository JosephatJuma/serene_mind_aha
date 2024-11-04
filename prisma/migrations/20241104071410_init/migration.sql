-- CreateEnum
CREATE TYPE "Status" AS ENUM ('WELCOME', 'NAME', 'AGE', 'GENDER', 'LOCATION', 'NEXT_OF_KIN', 'NEXT_OF_KIN_PHONE', 'SCREENING', 'FEELING_PAST_TWO_WEEKS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "phone" TEXT,
    "whatsapp_number" TEXT,
    "last_interaction" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "lastQuestionId" TEXT,
    "screeningStatus" "Status" NOT NULL DEFAULT 'WELCOME',
    "location" TEXT,
    "is_staying_with_someone" BOOLEAN,
    "someone_phone_number" TEXT,
    "isScreened" BOOLEAN,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question" (
    "id" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" VARCHAR(1000) NOT NULL,
    "parentId" TEXT,
    "status" "Status" NOT NULL,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" VARCHAR(1000) NOT NULL,
    "questionId" TEXT NOT NULL,
    "clientId" TEXT,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_whatsapp_number_key" ON "Client"("whatsapp_number");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_lastQuestionId_fkey" FOREIGN KEY ("lastQuestionId") REFERENCES "question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
