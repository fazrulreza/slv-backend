CREATE TABLE `getx_kpi` (
	`ID` VARCHAR(30) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`BUS_OWNER_POSITION` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`KPI_DATE` DATE NULL DEFAULT NULL,
	`START_DATE` DATE NULL DEFAULT NULL,
	`END_DATE` DATE NULL DEFAULT NULL,
	`TURNOVER_CURRENT` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TURNOVER_TARGET` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TURNOVER_ACHIEVEMENT` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TURNOVER_Q1` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TURNOVER_Q2` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TURNOVER_Q3` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TURNOVER_Q4` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TURNOVER_COMMENT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PROFITABILITY_CURRENT` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PROFITABILITY_TARGET` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PROFITABILITY_ACHIEVEMENT` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PROFITABILITY_Q1` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PROFITABILITY_Q2` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PROFITABILITY_Q3` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PROFITABILITY_Q4` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PROFITABILITY_COMMENT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SKILLED_CURRENT` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SKILLED_TARGET` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SKILLED_ACHIEVEMENT` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SKILLED_Q1` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SKILLED_Q2` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SKILLED_Q3` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SKILLED_Q4` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SKILLED_COMMENT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`UNSKILLED_CURRENT` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`UNSKILLED_TARGET` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`UNSKILLED_ACHIEVEMENT` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`UNSKILLED_Q1` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`UNSKILLED_Q2` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`UNSKILLED_Q3` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`UNSKILLED_Q4` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`UNSKILLED_COMMENT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EXPORT_REVENUE_CURRENT` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EXPORT_REVENUE_TARGET` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EXPORT_REVENUE_ACHIEVEMENT` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EXPORT_REVENUE_Q1` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EXPORT_REVENUE_Q2` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EXPORT_REVENUE_Q3` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EXPORT_REVENUE_Q4` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`EXPORT_REVENUE_COMMENT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`DIVERSIFY_CURRENT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`DIVERSIFY_TARGET` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`DIVERSIFY_ACHIEVEMENT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`DIVERSIFY_PERCENT` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`DIVERSIFY_Q1` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`DIVERSIFY_Q2` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`DIVERSIFY_Q3` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`DIVERSIFY_Q4` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`DIVERSIFY_COMMENT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TECHNOLOGY_CURRENT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TECHNOLOGY_TARGET` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TECHNOLOGY_ACHIEVEMENT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TECHNOLOGY_PERCENT` VARCHAR(5) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TECHNOLOGY_Q1` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TECHNOLOGY_Q2` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TECHNOLOGY_Q3` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TECHNOLOGY_Q4` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`TECHNOLOGY_COMMENT` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`BR_KEY_INITIATIVES` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`BR_ACTION_PLAN` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`BR_TIMELINE` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`LC_KEY_INITIATIVES` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`LC_ACTION_PLAN` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`LC_TIMELINE` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PR_KEY_INITIATIVES` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PR_ACTION_PLAN` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`PR_TIMELINE` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SR_KEY_INITIATIVES` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SR_ACTION_PLAN` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`SR_TIMELINE` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`FR_KEY_INITIATIVES` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`FR_ACTION_PLAN` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`FR_TIMELINE` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`CLIENT_ASPIRATIONS` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`CLIENT_CHALLENGES` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`INTERVENTION` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`FURTHER_NOTES` VARCHAR(400) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`COMPANY_ID` VARCHAR(30) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`ASSESSMENT_YEAR` INT(10) UNSIGNED NULL DEFAULT NULL,
	`UPDATED_AT` DATETIME NULL DEFAULT NULL,
	`UPDATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci',
	`CREATED_AT` DATETIME NULL DEFAULT NULL,
	`CREATED_BY` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci'
)
COLLATE='utf8mb4_0900_ai_ci'
ENGINE=InnoDB
ROW_FORMAT=DYNAMIC
;
