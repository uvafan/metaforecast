-- CreateTable
CREATE TABLE "PastcastQuestion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "fetched" TIMESTAMP(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "vantageDate" TIMESTAMP(3) NOT NULL,
    "vantageAggregateBinaryForecast" DOUBLE PRECISION,
    "binaryResolution" BOOLEAN,

    CONSTRAINT "PastcastQuestion_pkey" PRIMARY KEY ("id")
);
