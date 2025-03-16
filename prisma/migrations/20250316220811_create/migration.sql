-- CreateEnum
CREATE TYPE "TransactionMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'MONEY', 'BOLETO');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "method" "TransactionMethod" NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
