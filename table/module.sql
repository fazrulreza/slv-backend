CREATE TABLE `module` (
	`NAME` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`OWNER` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`STATUS` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`UPDATED_AT` DATETIME NULL DEFAULT NULL,
	`UPDATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`CREATED_AT` DATETIME NULL DEFAULT NULL,
	`CREATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	PRIMARY KEY (`NAME`) USING BTREE
)
COLLATE='utf8mb4_0900_ai_ci'
ENGINE=InnoDB
ROW_FORMAT=DYNAMIC
;
