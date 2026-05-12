-- CreateTable
CREATE TABLE "Pokemon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "dexNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
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
    "usagePct" REAL NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "regulations" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Move" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "power" INTEGER,
    "accuracy" INTEGER,
    "pp" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "targetShape" TEXT NOT NULL,
    "makesContact" BOOLEAN NOT NULL DEFAULT false,
    "effectText" TEXT NOT NULL,
    "effectChance" INTEGER,
    "usagePct" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Ability" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "longDesc" TEXT NOT NULL,
    "usagePct" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "usagePct" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Regulation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxVp" INTEGER NOT NULL,
    "allowTera" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Pokemon_slug_key" ON "Pokemon"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Move_slug_key" ON "Move"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Ability_slug_key" ON "Ability"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Item_slug_key" ON "Item"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Regulation_slug_key" ON "Regulation"("slug");
