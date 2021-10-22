CREATE TABLE `user` (
	`USER` VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`STATUS` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`ROLE` INT(10) NOT NULL DEFAULT '0',
	`UPDATED_AT` DATETIME NULL DEFAULT NULL,
	`UPDATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`CREATED_AT` DATETIME NULL DEFAULT NULL,
	`CREATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	PRIMARY KEY (`USER`) USING BTREE,
	INDEX `FK_user_user_role` (`ROLE`) USING BTREE,
	CONSTRAINT `FK_user_user_role` FOREIGN KEY (`ROLE`) REFERENCES `slv`.`user_role` (`ID`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8mb4_0900_ai_ci'
ENGINE=InnoDB
;
