-- CreateTable
CREATE TABLE "Pokemon" (
    "id" SERIAL NOT NULL,
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
    "usageStats" TEXT NOT NULL DEFAULT '{}',
    "usagePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "regulations" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pokemon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Move" (
    "id" SERIAL NOT NULL,
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
    "usagePct" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Move_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameI18n" TEXT NOT NULL DEFAULT '{}',
    "shortDesc" TEXT NOT NULL,
    "shortDescI18n" TEXT NOT NULL DEFAULT '{}',
    "longDesc" TEXT NOT NULL,
    "usagePct" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Ability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameI18n" TEXT NOT NULL DEFAULT '{}',
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descI18n" TEXT NOT NULL DEFAULT '{}',
    "usagePct" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Regulation" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxVp" INTEGER NOT NULL,
    "allowTera" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),

    CONSTRAINT "Regulation_pkey" PRIMARY KEY ("id")
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
