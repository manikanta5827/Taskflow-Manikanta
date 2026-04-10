/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "projects_deletedAt_idx";

-- DropIndex
DROP INDEX "tasks_deletedAt_idx";

-- DropIndex
DROP INDEX "users_deletedAt_idx";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "deletedAt";
