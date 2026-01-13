-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TournamentPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalPosition" INTEGER,
    "isQuit" BOOLEAN NOT NULL DEFAULT false,
    "isEliminated" BOOLEAN NOT NULL DEFAULT false,
    "eliminatedInRound" INTEGER,
    CONSTRAINT "TournamentPlayer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TournamentPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TournamentPlayer" ("eliminatedInRound", "finalPosition", "id", "isEliminated", "joinedAt", "tournamentId", "userId") SELECT "eliminatedInRound", "finalPosition", "id", "isEliminated", "joinedAt", "tournamentId", "userId" FROM "TournamentPlayer";
DROP TABLE "TournamentPlayer";
ALTER TABLE "new_TournamentPlayer" RENAME TO "TournamentPlayer";
CREATE UNIQUE INDEX "TournamentPlayer_tournamentId_userId_key" ON "TournamentPlayer"("tournamentId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
