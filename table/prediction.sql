CREATE TABLE `prediction` (
	`FACTOR` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`KEY` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`VALUE` INT(10) NOT NULL DEFAULT '1'
)
COLLATE='utf8mb4_0900_ai_ci'
ENGINE=InnoDB
;
