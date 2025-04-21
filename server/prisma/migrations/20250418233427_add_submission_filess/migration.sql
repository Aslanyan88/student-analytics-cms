/*
  Warnings:

  - You are about to drop the column `comment` on the `student_assignments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `student_assignments` DROP COLUMN `comment`,
    ADD COLUMN `fileUrl` VARCHAR(191) NULL,
    ADD COLUMN `submissionContent` TEXT NULL;
