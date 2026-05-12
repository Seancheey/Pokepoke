-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pokemon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "dexNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameI18n" TEXT NOT NULL DEFAULT '{}',
    "type1" TEXT NOT NULL,
    "type2" TEXT,
    "hp" INTEGER NOT NULL,
    "atk" INTEGER NOT NULL,
    "def" INTEGER NOT NULL,
    "spa" INTEGER NOT NULL,
    "spd" INTEGER NOT NULL,
    "spe" INTEGER NOT NULL,
    "abilities" TEXT NOT NULL,
    "hiddenAbility" TEXT,
    "spriteUrl" TEXT NOT NULL,
    "learnableMoves" TEXT NOT NULL DEFAULT '[]',
    "usagePct" REAL NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "regulations" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Pokemon" ("abilities", "atk", "createdAt", "def", "dexNo", "hiddenAbility", "hp", "id", "name", "nameI18n", "rank", "regulations", "slug", "spa", "spd", "spe", "spriteUrl", "type1", "type2", "updatedAt", "usagePct") SELECT "abilities", "atk", "createdAt", "def", "dexNo", "hiddenAbility", "hp", "id", "name", "nameI18n", "rank", "regulations", "slug", "spa", "spd", "spe", "spriteUrl", "type1", "type2", "updatedAt", "usagePct" FROM "Pokemon";
DROP TABLE "Pokemon";
ALTER TABLE "new_Pokemon" RENAME TO "Pokemon";
CREATE UNIQUE INDEX "Pokemon_slug_key" ON "Pokemon"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
