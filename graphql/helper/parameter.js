/**
 * ELSA Stage LOV
 */
const profileGroup = {
  1: 'PRE-TAKEOFF',
  2: 'TAKEOFF',
  3: 'MATURITY',
  4: 'STAGNATION',
  5: 'RENEWAL',
  6: 'DECLINE',
};

/**
 * Tiered Intervention LOV
 */
const tieredInterventionGroup = {
  1: 'Tier 2: Extra support required',
  2: 'Tier 2: Extra support required',
  3: 'Tier 1: Awareness creation (readiness for next lifecycle stage)',
  4: 'Tier 3: More intensive intervention',
  5: 'Tier 1: Awareness creation (readiness for next lifecycle stage)',
};

/**
 * State LOV
 */
const stateList = [
  'JOHOR',
  'KEDAH',
  'KELANTAN',
  'MELAKA',
  'NEGERI SEMBILAN',
  'PAHANG',
  'PERAK',
  'PERLIS',
  'PULAU PINANG',
  'SABAH',
  'SARAWAK',
  'SELANGOR',
  'TERENGGANU',
  'WILAYAH PERSEKUTUAN KUALA LUMPUR',
  'WILAYAH PERSEKUTUAN LABUAN',
  'WILAYAH PERSEKUTUAN PUTRAJAYA',
];

/**
 * ELSA Factor order
 */
const factorOrder = [
  'BR_',
  'LC_',
  'PR_',
  'SR_',
  'FR_',
];

/**
 * SME Size LOV
 */
const smeSizeChoice = {
  1: {
    classValue: 'SOLE TRADER',
    salesValue: 1,
  },
  2: {
    classValue: 'MICRO ENTERPRISE',
    salesValue: 2,
  },
  3: {
    classValue: 'SMALL ENTERPRISE',
    salesValue: 3,
  },
  4: {
    classValue: 'MEDIUM ENTERPRISE',
    salesValue: 4,
  },
  5: {
    classValue: 'LARGE ENTERPRISE',
    salesValue: 5,
  },
};

/**
 * Required Company Fields for data check and transformation
 */
const requiredCompanyFields = {
  ENTITY_NAME: 'Company Name',
  REGISTRATION_NO: 'Registration Number',
  NEW_REGISTRATION_NO: 'New Registration Number',
  INCORPORATION_DATE: 'Incorporation Date',
  BUMI_STATUS: 'Bumiputera Status',
  WOMAN_OWNED: '51% & Above Owned by Woman',
  ENTITY_STATUS: 'Company Status',
  ENTITY_TYPE: 'Company Type',
  ADDRESS_LINE_1: 'Address Line 1',
  POSTCODE: 'Postcode',
  STATE: 'State',
  PHONE: 'Phone Number',
  EMAIL: 'Email Address',
  NATURE_OF_BUSINESS: 'Nature of Business',
};

/**
 * Required User Fields for data check
 */
const requiredUserFields = {
  NAME: 'Name',
  EMAIL: 'Email',
  PWD: 'Password',
};

/**
 * Survey Flag Fields for data check
 */
const surveyFlagFields = [
  'PRODUCT_FEEDBACK_COLLECTION_FLAG',
  'OWNER_MANAGED_FLAG',
  'ORGANIZATION_STRUCTURE_FLAG',
  'EMPLOYEE_OJT_FLAG',
  'EMPLOYEE_SOP_FLAG',
  'EMPLOYEE_WRITTEN_CONTRACT_FLAG',
  'EMPLOYEE_JD_KPI_FLAG',
  'OPERATIONAL_GUIDELINE_FLAG',
  'BUSINESS_PLAN_FLAG',
  'SEEK_FINANCING_2YEARS_FLAG',
  'REGISTERED_BANK_ACCOUNT_FLAG',
  'AUDIT_BUSINESS_ACCOUNT_FLAG',
  'SST_FLAG',
];

/**
 * Required survey Fields for data check
 */
const commonSurveyFields = [
  'OPERATING_HISTORY',
  'YEARLY_BUSINESS_PERFORMANCE',
  'YEARLY_INDUSTRY_PERFORMANCE',
  'PRODUCT_COUNT',
  'PRODUCT_PERFORMANCE_2YEARS',
  'PRODUCT_MARKET_LOCATION',
  'EMPLOYEE_COUNT',
  'BUSINESS_OWNER_INVOLVE_PERCENTAGE',
  'EMPLOYEE_COUNT_2YEARS',
  'LATE_PAYMENT_CUSTOMER',
];

/**
 * Assessment Fields with integer for data check
 */
const assessmentIntObj = [
  'OH_OPERATING_HISTORY',
  'IG_INDUSTRY_POTENTIAL',
  'BR_PRODUCT_LINE',
  'BR_PRODUCT_QUALITY',
  'BR_TECHNOLOGY',
  'BR_DEVELOPMENT_CAPACITY',
  'LC_ORGANIZATION',
  'LC_PLANNING',
  'PR_STAFFING',
  'PR_STAFF_PERFORMANCE',
  'SR_EXECUTION_CAPACITY',
  'SR_BUDGETTING',
  'FR_FINANCE',
  'FR_FINANCIAL_SYSTEM',
];

const yesNoObj = ['YES', 'NO'];

module.exports = {
  profileGroup,
  tieredInterventionGroup,
  stateList,
  smeSizeChoice,
  surveyFlagFields,
  assessmentIntObj,
  yesNoObj,
  requiredCompanyFields,
  commonSurveyFields,
  factorOrder,
  requiredUserFields,
};
