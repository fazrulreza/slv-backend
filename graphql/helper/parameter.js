const classScore = {
  BR_PRODUCT_LINE: {
    'SOLE TRADER': 1,
    'MICRO ENTERPRISE': 2,
    'SMALL ENTERPRISE': 2,
    'MEDIUM ENTERPRISE': 3,
  },
  BR_PRODUCT_QUALITY: {
    'SOLE TRADER': 2,
    'MICRO ENTERPRISE': 2,
    'SMALL ENTERPRISE': 2,
    'MEDIUM ENTERPRISE': 3,
  },
  BR_TECHNOLOGY: {
    'SOLE TRADER': 2,
    'MICRO ENTERPRISE': 2,
    'SMALL ENTERPRISE': 3,
    'MEDIUM ENTERPRISE': 3,
  },
  BR_DEVELOPMENT_CAPACITY: {
    'SOLE TRADER': 1,
    'MICRO ENTERPRISE': 1,
    'SMALL ENTERPRISE': 2,
    'MEDIUM ENTERPRISE': 3,
  },
  LC_ORGANIZATION: {
    'SOLE TRADER': 'N/A',
    'MICRO ENTERPRISE': 1,
    'SMALL ENTERPRISE': 2,
    'MEDIUM ENTERPRISE': 3,
  },
  LC_PLANNING: {
    'SOLE TRADER': 'N/A',
    'MICRO ENTERPRISE': 2,
    'SMALL ENTERPRISE': 3,
    'MEDIUM ENTERPRISE': 3,
  },
  PR_STAFFING: {
    'SOLE TRADER': 'N/A',
    'MICRO ENTERPRISE': 2,
    'SMALL ENTERPRISE': 2,
    'MEDIUM ENTERPRISE': 2,
  },
  PR_STAFF_PERFORMANCE: {
    'SOLE TRADER': 'N/A',
    'MICRO ENTERPRISE': 1,
    'SMALL ENTERPRISE': 2,
    'MEDIUM ENTERPRISE': 3,
  },
  SR_EXECUTION_CAPACITY: {
    'SOLE TRADER': 'N/A',
    'MICRO ENTERPRISE': 1,
    'SMALL ENTERPRISE': 2,
    'MEDIUM ENTERPRISE': 3,
  },
  SR_BUDGETTING: {
    'SOLE TRADER': 'N/A',
    'MICRO ENTERPRISE': 1,
    'SMALL ENTERPRISE': 2,
    'MEDIUM ENTERPRISE': 3,
  },
  FR_FINANCE: {
    'SOLE TRADER': 1,
    'MICRO ENTERPRISE': 2,
    'SMALL ENTERPRISE': 3,
    'MEDIUM ENTERPRISE': 3,
  },
  FR_FINANCIAL_SYSTEM: {
    'SOLE TRADER': 1,
    'MICRO ENTERPRISE': 2,
    'SMALL ENTERPRISE': 2,
    'MEDIUM ENTERPRISE': 3,
  },
};

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
  'KUALA LUMPUR',
  'LABUAN',
  'PUTRAJAYA',
];

module.exports = {
  profileGroup,
  classScore,
  tieredInterventionGroup,
  stateList,
};
