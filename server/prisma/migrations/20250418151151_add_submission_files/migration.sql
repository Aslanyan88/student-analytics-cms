-- AlterTable
ALTER TABLE `activity_logs` ADD COLUMN `action` VARCHAR(191) NULL,
    ADD COLUMN `details` TEXT NULL;

-- AlterTable
ALTER TABLE `student_assignments` ADD COLUMN `comment` TEXT NULL;

-- CreateTable
CREATE TABLE `submission_files` (
    `id` VARCHAR(191) NOT NULL,
    `studentAssignmentId` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `submission_files` ADD CONSTRAINT `submission_files_studentAssignmentId_fkey` FOREIGN KEY (`studentAssignmentId`) REFERENCES `student_assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
