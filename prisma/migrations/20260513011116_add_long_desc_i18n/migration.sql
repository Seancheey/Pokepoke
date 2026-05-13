-- AlterTable
ALTER TABLE "Ability" ADD COLUMN     "longDescI18n" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "descLongI18n" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Move" ADD COLUMN     "effectLongI18n" TEXT NOT NULL DEFAULT '{}';
