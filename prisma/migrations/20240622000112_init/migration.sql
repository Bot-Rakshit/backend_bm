-- CreateTable
CREATE TABLE "ChessInfo" (
    "id" TEXT NOT NULL,
    "blitz" INTEGER NOT NULL,
    "bullet" INTEGER NOT NULL,
    "rapid" INTEGER NOT NULL,
    "puzzle" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ChessInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChessInfo_userId_key" ON "ChessInfo"("userId");

-- AddForeignKey
ALTER TABLE "ChessInfo" ADD CONSTRAINT "ChessInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
