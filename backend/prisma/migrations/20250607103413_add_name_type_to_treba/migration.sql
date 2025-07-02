/*
  Warnings:

  - You are about to drop the column `type` on the `TrebaName` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Treba` ADD COLUMN `nameType` ENUM('ZA_ZDRAVIE', 'ZA_UPOKOY') NOT NULL DEFAULT 'ZA_ZDRAVIE';

-- AlterTable
ALTER TABLE `TrebaName` DROP COLUMN `type`;
