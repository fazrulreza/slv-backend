CREATE TABLE `token_blacklist` (
	`ID` INT(10) NOT NULL AUTO_INCREMENT,
	`TOKEN` LONGTEXT NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`CREATED_AT` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`ID`) USING BTREE
)
COLLATE='utf8mb4_0900_ai_ci'
ENGINE=InnoDB
AUTO_INCREMENT=4
;
