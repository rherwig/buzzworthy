/*
  Warnings:

  - Added the required column `position` to the `Clue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Clue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "isDailyDouble" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "Clue_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Clue" ("categoryId", "id", "isDailyDouble", "prompt", "solution", "value") SELECT "categoryId", "id", "isDailyDouble", "prompt", "solution", "value" FROM "Clue";
DROP TABLE "Clue";
ALTER TABLE "new_Clue" RENAME TO "Clue";
CREATE UNIQUE INDEX "Clue_categoryId_position_key" ON "Clue"("categoryId", "position");
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Game" ("createdAt", "id", "title") SELECT "createdAt", "id", "title" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
