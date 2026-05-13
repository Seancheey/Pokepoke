-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "games" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Pokemon" ADD COLUMN     "games" TEXT NOT NULL DEFAULT '[]';
