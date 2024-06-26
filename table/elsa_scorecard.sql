CREATE TABLE `elsa_scorecard` (
	`ID` VARCHAR(30) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`FACTOR` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`FINAL_SCORE` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`FINAL_SCORE_ROUNDDOWN` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`NEXT_DESIRED_SCORE` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`NEXT_DESIRED_PROFILE` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PRIORITY_ACTION_TAKEN` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`RECOMMENDED_TIERED_INTERVENTION` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`COMPANY_ID` VARCHAR(30) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`MODULE` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`ASSESSMENT_YEAR` INT(10) UNSIGNED NULL DEFAULT NULL,
	`PREDICTION` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`UPDATED_AT` DATETIME NULL DEFAULT NULL,
	`UPDATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`CREATED_AT` DATETIME NULL DEFAULT NULL,
	`CREATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	PRIMARY KEY (`ID`) USING BTREE,
	INDEX `FK_elsa_scorecard_company_profile` (`COMPANY_ID`) USING BTREE,
	CONSTRAINT `FK_elsa_scorecard_company_profile` FOREIGN KEY (`COMPANY_ID`) REFERENCES `company_profile` (`ID`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8mb4_0900_ai_ci'
ENGINE=InnoDB
;
