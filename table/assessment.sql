CREATE TABLE `assessment` (
	`ID` VARCHAR(30) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`OH_OPERATING_HISTORY` INT(10) NULL DEFAULT NULL,
	`OH_OPERATING_HISTORY_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`IG_INDUSTRY_POTENTIAL` INT(10) NULL DEFAULT NULL,
	`IG_INDUSTRY_POTENTIAL_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`BR_PRODUCT_LINE` INT(10) NULL DEFAULT NULL,
	`BR_PRODUCT_LINE_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`BR_PRODUCT_QUALITY` INT(10) NULL DEFAULT NULL,
	`BR_PRODUCT_QUALITY_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`BR_TECHNOLOGY` INT(10) NULL DEFAULT NULL,
	`BR_TECHNOLOGY_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`BR_DEVELOPMENT_CAPACITY` INT(10) NULL DEFAULT NULL,
	`BR_DEVELOPMENT_CAPACITY_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`LC_ORGANIZATION` INT(10) NULL DEFAULT NULL,
	`LC_ORGANIZATION_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`LC_PLANNING` INT(10) NULL DEFAULT NULL,
	`LC_PLANNING_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PR_STAFFING` INT(10) NULL DEFAULT NULL,
	`PR_STAFFING_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PR_STAFF_PERFORMANCE` INT(10) NULL DEFAULT NULL,
	`PR_STAFF_PERFORMANCE_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SR_EXECUTION_CAPACITY` INT(10) NULL DEFAULT NULL,
	`SR_EXECUTION_CAPACITY_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SR_BUDGETTING` INT(10) NULL DEFAULT NULL,
	`SR_BUDGETTING_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`FR_FINANCE` INT(10) NULL DEFAULT NULL,
	`FR_FINANCE_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`FR_FINANCIAL_SYSTEM` INT(10) NULL DEFAULT NULL,
	`FR_FINANCIAL_SYSTEM_COMMENT` VARCHAR(500) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`COMPANY_ID` VARCHAR(30) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`MODULE` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`ASSESSMENT_YEAR` INT(10) UNSIGNED NULL DEFAULT NULL,
	`UPDATED_AT` DATETIME NULL DEFAULT NULL,
	`UPDATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`CREATED_AT` DATETIME NULL DEFAULT NULL,
	`CREATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	PRIMARY KEY (`ID`) USING BTREE,
	INDEX `FK_assessment_company_profile` (`COMPANY_ID`) USING BTREE,
	CONSTRAINT `FK_assessment_company_profile` FOREIGN KEY (`COMPANY_ID`) REFERENCES `company_profile` (`ID`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8mb4_0900_ai_ci'
ENGINE=InnoDB
;
