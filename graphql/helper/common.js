
// const getFilter = (size, state, sector, revenue, year, division, msic) => {
//   let filter = '';
//   if (size && !filter.includes('sme_size.keyword') && size !== 'ALL') {
//     filter += ` sme_size.keyword: "${getSize(size)}" `;
//   }
//   if (state && !filter.includes('state_a.keyword') && state !== 'ALL') {
//     filter += ` state_a.keyword: "${state}" `;
//   }
//   if (sector && !filter.includes('msic_sector.keyword') && sector !== 'ALL') {
//     filter += ` msic_sector.keyword: "${sector}" `;
//   }
//   if (year && !filter.includes('year.keyword')) {
//     filter += ` year.keyword: "${year}" `;
//   }
//   if (revenue && !filter.includes('yr_revenue_amt')) {
//     filter += ` yr_revenue_amt: [${revenue}] `;
//   }
//   if (division && !filter.includes('msic_division')) {
//     filter += ` msic_division.keyword: "${division}" `;
//   }
//   if (msic && !filter.includes('msic_item')) {
//     filter += ` msic_item.keyword: "${msic}" `;
//   }

//   //   _.forOwn(rest, (value, key) => {
//   //     const field = key.replace('.keyword', '');
//   //     filter += ` ${field}: "${value}" `;
//   //   });

//   return filter;
// };

const getDifference = (curr, hist) => Object.entries(hist)
  .filter(([key, val]) => curr[key] !== val && key in curr)
  .reduce((acc, [key, v]) => ({ ...acc, [key]: v }), {});


const processSurveyResult = result => ({
  AVAILABLE_SYSTEM: result.AVAILABLE_SYSTEM
    ? JSON.parse(result.AVAILABLE_SYSTEM)
    : [],
  MARKETING_TYPE: result.MARKETING_TYPE
    ? JSON.parse(result.MARKETING_TYPE)
    : [],
  ONLINE_MARKETING_TYPE: result.ONLINE_MARKETING_TYPE
    ? JSON.parse(result.ONLINE_MARKETING_TYPE)
    : [],
  BUSINESS_FUTURE_PLAN: result.BUSINESS_FUTURE_PLAN
    ? JSON.parse(result.BUSINESS_FUTURE_PLAN)
    : [],
  SEEK_FINANCING_METHOD: result.SEEK_FINANCING_METHOD
    ? JSON.parse(result.SEEK_FINANCING_METHOD)
    : [],
  CUSTOMER_PAYMENT_METHODS: result.CUSTOMER_PAYMENT_METHODS
    ? JSON.parse(result.CUSTOMER_PAYMENT_METHODS)
    : [],
  EMPLOYEE_COUNT_DETAIL: {
    FULLTIME: result.FULLTIME_EMPLOYEE_COUNT || 0,
    PARTTIME: result.PARTTIME_EMPLOYEE_COUNT || 0,
  },
  EMPLOYEE_DETAILS: {
    FULLTIME: result.FULLTIME_EMPLOYEE_COUNT || 0,
    OWNER_MANAGED_100: result.OWNER_MANAGED_100 || 0,
  },
});


const cleanEmpty = (obj) => {
  if (Array.isArray(obj)) {
    return obj
      .map(v => ((v && typeof v === 'object') ? cleanEmpty(v) : v))
      .filter(v => !(v == null));
  }
  return Object.entries(obj)
    .map(([k, v]) => [k, v && typeof v === 'object' ? cleanEmpty(v) : v])
    .reduce((a, [k, v]) => ((v === null || v.length === 0) ? a : (a[k] = v, a)), {});
  // || Object.values(v).length === 0)
};

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

const nextDesiredProfileGroup = {
  2: 'TAKEOFF',
  3: 'MATURITY',
  5: 'RENEWAL',
};

const tieredInterventionGroup = {
  1: 'Tier 2: Extra support required',
  2: 'Tier 2: Extra support required',
  3: 'Tier 1: Awareness creation (readiness for next lifecycle stage)',
  4: 'Tier 3: More intensive intervention',
  5: 'Tier 1: Awareness creation (readiness for next lifecycle stage)',
};

const calculateScores = (getClassScore, initial) => {
  const tempGroup = getClassScore
    .filter(x => Object.keys(x)[0].startsWith(initial))
    .reduce((acc, v) => {
      if (v.unitClassScore === 'N/A') {
        return {
          totalUnitClassScore: 'N/A',
          totalWeightedScore: 'N/A',
        };
      }
      const totalUnitClassScore = (acc.totalUnitClassScore && acc.totalUnitClassScore !== 0)
        ? acc.totalUnitClassScore + v.unitClassScore
        : v.unitClassScore;
      const totalWeightedScore = (acc.totalWeightedScore && acc.totalWeightedScore !== 0)
        ? acc.totalWeightedScore + v.weightedScore
        : v.weightedScore;
      return {
        totalUnitClassScore,
        totalWeightedScore,
      };
    }, {});
  let finalScore = 'N/A';
  let finalScoreFloor = 'N/A';
  let nextDesiredScore = 'N/A';
  let nextDesiredProfile = 'N/A';
  let recommendedTieredIntervention = 'N/A';
  let priorityActionTaken = 'N/A';
  if (tempGroup.totalUnitClassScore !== 'N/A') {
    const finalScorePre = tempGroup.totalWeightedScore / tempGroup.totalUnitClassScore;
    finalScore = (Math.round(finalScorePre * 10) / 10);
    finalScoreFloor = Math.floor(finalScorePre);

    // get next desired score
    switch (true) {
      case (finalScoreFloor === 3 || finalScoreFloor === 5):
        nextDesiredScore = 'N/A';
        break;
      case (finalScoreFloor === 6):
        nextDesiredScore = 5;
        break;
      default:
        nextDesiredScore = finalScoreFloor + 1;
        break;
    }
    nextDesiredProfile = nextDesiredProfileGroup[nextDesiredScore] || 'N/A';
    recommendedTieredIntervention = nextDesiredScore === 'N/A'
      ? 'N/A'
      : tieredInterventionGroup[finalScoreFloor];
    priorityActionTaken = (
      nextDesiredScore !== 3 && (recommendedTieredIntervention === tieredInterventionGroup[1]
      || recommendedTieredIntervention === tieredInterventionGroup[4]))
      ? 'PRIORITY'
      : '';
  }
  const finalGroup = {
    FACTOR: initial,
    FINAL_SCORE: finalScore,
    FINAL_SCORE_ROUNDDOWN: finalScoreFloor,
    NEXT_DESIRED_SCORE: nextDesiredScore,
    NEXT_DESIRED_PROFILE: nextDesiredProfile,
    PRIORITY_ACTION_TAKEN: priorityActionTaken,
    RECOMMENDED_TIERED_INTERVENTION: recommendedTieredIntervention,
  };
  // console.log(initial, finalGroup);
  return finalGroup;
};

module.exports = {
  // getFilter,
  getDifference,
  processSurveyResult,
  cleanEmpty,
  calculateScores,
  classScore,
};
