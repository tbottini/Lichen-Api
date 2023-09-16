-- CreateTable
CREATE TABLE "Connection" (
    "id" SERIAL NOT NULL,
    "fromEmail" VARCHAR(255) NOT NULL,
    "toEmail" VARCHAR(255) NOT NULL,
    "requestContent" TEXT NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);
