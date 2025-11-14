/*
  Warnings:

  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT,
    "password" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "displayName", "email", "id", "isOnline", "lastSeenAt", "name", "password", "salt", "surname", "updatedAt") SELECT "avatarUrl", "createdAt", "displayName", "email", "id", "isOnline", "lastSeenAt", "name", "password", "salt", "surname", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_displayName_key" ON "User"("displayName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
