const profileGroup = {
  1: 'PRE-TAKEOFF',
  2: 'TAKEOFF',
  3: 'MATURITY',
  4: 'STAGNATION',
  5: 'RENEWAL',
  6: 'DECLINE',
};

const tieredInterventionGroup = {
  1: 'Tier 2: Extra support required',
  2: 'Tier 2: Extra support required',
  3: 'Tier 1: Awareness creation (readiness for next lifecycle stage)',
  4: 'Tier 3: More intensive intervention',
  5: 'Tier 1: Awareness creation (readiness for next lifecycle stage)',
};

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

const factorOrder = [
  'BR_',
  'LC_',
  'PR_',
  'SR_',
  'FR_',
];

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
};
