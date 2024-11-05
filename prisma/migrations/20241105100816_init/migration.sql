-- CreateEnum
CREATE TYPE "Status" AS ENUM ('WELCOME', 'NAME', 'AGE', 'GENDER', 'LOCATION', 'NEXT_OF_KIN', 'NEXT_OF_KIN_PHONE', 'SCREENING', 'DEPRESSION', 'ANXIETY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "phone" TEXT,
    "whatsapp_number" TEXT,
    "last_interaction" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "screeningStatus" "Status" NOT NULL DEFAULT 'WELCOME',
    "location" TEXT,
    "is_staying_with_someone" BOOLEAN,
    "someone_phone_number" TEXT,
    "isScreened" BOOLEAN,
    "lastScreenDate" TIMESTAMP(3),
    "currentQuestionIndex" INTEGER,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question" (
    "id" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" VARCHAR(1000) NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "response" (
    "id" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answer" VARCHAR(1000) NOT NULL,
    "clientId" TEXT,

    CONSTRAINT "response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "client_whatsapp_number_key" ON "client"("whatsapp_number");

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response" ADD CONSTRAINT "response_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
