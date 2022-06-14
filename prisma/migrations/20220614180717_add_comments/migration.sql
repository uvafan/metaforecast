-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "voteTotal" INTEGER NOT NULL DEFAULT 0,
    "parentCommentId" TEXT,
    "questionId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "predictionValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);
