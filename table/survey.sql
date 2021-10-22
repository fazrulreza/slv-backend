CREATE TABLE `survey` (
	`ID` VARCHAR(30) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`OPERATING_HISTORY` VARCHAR(20) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`YEARLY_BUSINESS_PERFORMANCE` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`YEARLY_INDUSTRY_PERFORMANCE` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PRODUCT_COUNT` VARCHAR(30) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PRODUCT_PERFORMANCE_2YEARS` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PRODUCT_MARKET_LOCATION` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PRODUCT_FEEDBACK_COLLECTION_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`AVAILABLE_SYSTEM` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`MARKETING_TYPE` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`ONLINE_MARKETING_TYPE` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`OWNER_MANAGED_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`ORGANIZATION_STRUCTURE_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EMPLOYEE_COUNT` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`FULLTIME_EMPLOYEE_COUNT` INT(10) NULL DEFAULT NULL,
	`PARTTIME_EMPLOYEE_COUNT` INT(10) NULL DEFAULT NULL,
	`BUSINESS_OWNER_INVOLVE_PERCENTAGE` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EMPLOYEE_OJT_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EMPLOYEE_SOP_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EMPLOYEE_WRITTEN_CONTRACT_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EMPLOYEE_COUNT_2YEARS` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EMPLOYEE_JD_KPI_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`OPERATIONAL_GUIDELINE_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`BUSINESS_PLAN_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`BUSINESS_FUTURE_PLAN` VARCHAR(350) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SEEK_FINANCING_2YEARS_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SEEK_FINANCING_METHOD` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`CUSTOMER_PAYMENT_METHODS` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`LATE_PAYMENT_CUSTOMER` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`REGISTERED_BANK_ACCOUNT_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`REGISTERED_BANK_ACCOUNT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`AUDIT_BUSINESS_ACCOUNT_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SST_FLAG` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`OWNER_MANAGED_100` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SALES_TURNOVER` INT(10) NULL DEFAULT NULL,
	`SME_CLASS` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`ANNUAL_TURNOVER` DOUBLE NOT NULL,
	`COMPANY_ID` VARCHAR(30) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`MODULE` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`ASSESSMENT_YEAR` INT(10) UNSIGNED NULL DEFAULT NULL,
	`UPDATED_AT` DATETIME NULL DEFAULT NULL,
	`UPDATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`CREATED_AT` DATETIME NULL DEFAULT NULL,
	`CREATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	PRIMARY KEY (`ID`) USING BTREE,
	INDEX `FK_survey_company_profile` (`COMPANY_ID`) USING BTREE,
	CONSTRAINT `FK_survey_company_profile` FOREIGN KEY (`COMPANY_ID`) REFERENCES `slv`.`company_profile` (`ID`) ON UPDATE NO ACTION ON DELETE NO ACTION
)
COLLATE='utf8mb4_0900_ai_ci'
ENGINE=InnoDB
;
