-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ability" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameI18n" TEXT NOT NULL DEFAULT '{}',
    "shortDesc" TEXT NOT NULL,
    "shortDescI18n" TEXT NOT NULL DEFAULT '{}',
    "longDesc" TEXT NOT NULL,
    "usagePct" REAL NOT NULL DEFAULT 0
);
INSERT INTO "new_Ability" ("id", "longDesc", "name", "shortDesc", "slug", "usagePct") SELECT "id", "longDesc", "name", "shortDesc", "slug", "usagePct" FROM "Ability";
DROP TABLE "Ability";
ALTER TABLE "new_Ability" RENAME TO "Ability";
CREATE UNIQUE INDEX "Ability_slug_key" ON "Ability"("slug");
CREATE TABLE "new_Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameI18n" TEXT NOT NULL DEFAULT '{}',
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descI18n" TEXT NOT NULL DEFAULT '{}',
    "usagePct" REAL NOT NULL DEFAULT 0
);
INSERT INTO "new_Item" ("category", "description", "id", "name", "slug", "usagePct") SELECT "category", "description", "id", "name", "slug", "usagePct" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE UNIQUE INDEX "Item_slug_key" ON "Item"("slug");
CREATE TABLE "new_Move" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameI18n" TEXT NOT NULL DEFAULT '{}',
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "power" INTEGER,
    "accuracy" INTEGER,
    "pp" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "targetShape" TEXT NOT NULL,
    "makesContact" BOOLEAN NOT NULL DEFAULT false,
    "effectText" TEXT NOT NULL,
    "effectI18n" TEXT NOT NULL DEFAULT '{}',
    "effectChance" INTEGER,
    "usagePct" REAL NOT NULL DEFAULT 0
);
INSERT INTO "new_Move" ("accuracy", "category", "effectChance", "effectText", "id", "makesContact", "name", "power", "pp", "priority", "slug", "targetShape", "type", "usagePct") SELECT "accuracy", "category", "effectChance", "effectText", "id", "makesContact", "name", "power", "pp", "priority", "slug", "targetShape", "type", "usagePct" FROM "Move";
DROP TABLE "Move";
ALTER TABLE "new_Move" RENAME TO "Move";
CREATE UNIQUE INDEX "Move_slug_key" ON "Move"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
