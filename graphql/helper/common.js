/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
const jwt = require('jsonwebtoken');
const { readFileSync } = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { profileGroup, tieredInterventionGroup } = require('./parameter');

const SECRET = readFileSync(path.join(__dirname, process.env.SECRET));
const SECRET_PUB = readFileSync(path.join(__dirname, process.env.SECRET_PUB));
// console.log(path.join(__dirname, process.env.SECRET));

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

/**
 * Get difference between current and historical data
 * @param {Object} curr current data
 * @param {Object} hist historical data
 * @returns {Object} difference
 */
const getDifference = (curr, hist) => Object.entries(hist)
  .filter(([key, val]) => curr[key] !== val && key in curr)
  .reduce((acc, [key, v]) => ({ ...acc, [key]: v }), {});

/**
 * Process survey data from DB to suit response
 * @param {Object} result data from DB
 * @returns {Object} processed data
 */
const processSurveyResult = (result) => {
  const AVAILABLE_SYSTEM = result.AVAILABLE_SYSTEM
    ? JSON.parse(result.AVAILABLE_SYSTEM)
    : [];

  const MARKETING_TYPE = result.MARKETING_TYPE
    ? JSON.parse(result.MARKETING_TYPE)
    : [];

  const ONLINE_MARKETING_TYPE = result.ONLINE_MARKETING_TYPE
    ? JSON.parse(result.ONLINE_MARKETING_TYPE)
    : [];

  const BUSINESS_FUTURE_PLAN = result.BUSINESS_FUTURE_PLAN
    ? JSON.parse(result.BUSINESS_FUTURE_PLAN)
    : [];

  const SEEK_FINANCING_METHOD = result.SEEK_FINANCING_METHOD
    ? JSON.parse(result.SEEK_FINANCING_METHOD)
    : [];

  const CUSTOMER_PAYMENT_METHODS = result.CUSTOMER_PAYMENT_METHODS
    ? JSON.parse(result.CUSTOMER_PAYMENT_METHODS)
    : [];

  const FULLTIME = result.FULLTIME_EMPLOYEE_COUNT || 0;
  const PARTTIME = result.PARTTIME_EMPLOYEE_COUNT || 0;
  const OWNER_MANAGED_100 = result.OWNER_MANAGED_100 || 0;

  return {
    AVAILABLE_SYSTEM,
    MARKETING_TYPE,
    ONLINE_MARKETING_TYPE,
    BUSINESS_FUTURE_PLAN,
    SEEK_FINANCING_METHOD,
    CUSTOMER_PAYMENT_METHODS,
    EMPLOYEE_COUNT_DETAIL: {
      FULLTIME,
      PARTTIME,
    },
    EMPLOYEE_DETAILS: {
      FULLTIME,
      OWNER_MANAGED_100,
    },
  };
};

/**
 * Remove Empty entries in object
 * @param {Object} obj Object to be processed
 * @returns Object without empty entries
 */
const cleanEmpty = (obj) => {
  if (Array.isArray(obj)) {
    return obj
      .map((v) => ((v && typeof v === 'object') ? cleanEmpty(v) : v))
      .filter((v) => !(v == null));
  }
  return Object.entries(obj)
    .map(([k, v]) => [k, v && typeof v === 'object' ? cleanEmpty(v) : v])
    .reduce((a, [k, v]) => ((v === null || v.length === 0) ? a : (a[k] = v, a)), {});
  // || Object.values(v).length === 0)
};

/**
 * Calculate ELSA items
 * @param {Object} getClassScore Object containing ELSA scores
 * @param {string} initial type of data to be calculated
 * @param {number} year assessment year
 * @returns {Object} ELSA items
 */
const calculateScores = (getClassScore, initial, year) => {
  const tempGroup = getClassScore
    .filter((x) => Object.keys(x)[0].startsWith(initial))
    .reduce((acc, v) => {
      if (v.unitClassScore === 'N/A' || v.unitClassScore === 0) {
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
    finalScore = (Math.round(finalScorePre * 100) / 100);
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
    nextDesiredProfile = profileGroup[nextDesiredScore] || 'N/A';
    recommendedTieredIntervention = nextDesiredScore === 'N/A'
      ? 'N/A'
      : tieredInterventionGroup[finalScoreFloor];
    priorityActionTaken = (
      nextDesiredScore !== 3 && (finalScoreFloor === 1 || finalScoreFloor === 4))
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
    ASSESSMENT_YEAR: year,
  };
  // console.log(initial, finalGroup);
  return finalGroup;
};

/**
 * Calculate KPI total score
 * @param {Object} scorecard contains all the scores for KPI
 * @returns {number} total scores of KPI
 */
const getTotalScore = (scorecard) => {
  // console.log(scorecard);
  // console.log(scorecard.map((y) => y.FINAL_SCORE));
  const sumScore = scorecard
    .reduce(((acc, v) => (v.FINAL_SCORE === 'N/A' ? acc : acc + parseFloat(v.FINAL_SCORE))), 0);
  const countScore = scorecard
    .reduce(((acc, v) => (v.FINAL_SCORE === 'N/A' ? acc : acc + 1)), 0);
  // console.log(sumScore);
  // console.log(countScore);
  // console.log(sumScore / countScore);
  // console.log((Math.floor((sumScore / countScore) * 10) / 10));
  return (Math.floor((sumScore / countScore) * 10) / 10);
};

/**
 * Process DB data to be suited in response
 * @param {Object} data DB data containing user Roles
 * @returns {Object} processed DB data
 */
const processUserRolesOutput = (data) => {
  const preOutput = data.dataValues;
  const processedOutput = {
    ...preOutput,
    COMPANY_MODULE: JSON.parse(preOutput.COMPANY_MODULE),
    SURVEY_MODULE: JSON.parse(preOutput.SURVEY_MODULE),
    ASSESSMENT_MODULE: JSON.parse(preOutput.ASSESSMENT_MODULE),
    USER_MODULE: JSON.parse(preOutput.USER_MODULE),
    ROLES_MODULE: JSON.parse(preOutput.ROLES_MODULE),
    GETX_MODULE: JSON.parse(preOutput.GETX_MODULE),
    ELSA_MODULE: JSON.parse(preOutput.ELSA_MODULE),
  };
  return processedOutput;
};

/**
 * Check user access
 * @param {string} permission Permission requested
 * @param {Object} userRoleList Contains list of all available access right
 * @returns {Boolean} has access or vice versa
 */
const checkPermission = (permission, userRoleList) => {
  const [subModule, auth] = permission.split('-');

  if (userRoleList.STATUS !== 'ACTIVE') return false;
  return userRoleList[`${subModule}_MODULE`].includes(auth);
};

/**
 * Decrypt string using JWT
 * @param {string} token token to be decrypted
 * @returns {Object} decrypted object
 */
const verifyToken = (token) => {
  let decodeData = {};
  jwt.verify(token, SECRET_PUB, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      decodeData = {
        name: err.name,
        message: err.message,
      };
    } else {
      decodeData = decoded;
    }
  });
  return decodeData;
};

/**
 * Encrypt token using JWT
 * @param {Object} token object to be encrypted
 * @param {string} expiresIn time before token expires
 * @returns {string} JWT string
 */
const signToken = (token, expiresIn) => jwt.sign(
  token,
  SECRET,
  {
    expiresIn,
    algorithm: 'RS256',
  },
);

/**
 * Hash password
 * @param {string} password password to be hashed
 * @returns {string} hashed password
 */
const hashPasswordAsync = async (password) => {
  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

/**
 * Compare text with its hashed counterpart
 * @param {string} text text to be compared
 * @param {string} hashed hashed counterpart
 * @returns {boolean} true / false
 */
const comparePasswordAsync = async (text, hashed) => bcrypt.compare(text, hashed);

module.exports = {
  // getFilter,
  getDifference,
  processSurveyResult,
  cleanEmpty,
  calculateScores,
  getTotalScore,
  processUserRolesOutput,
  checkPermission,
  verifyToken,
  signToken,
  hashPasswordAsync,
  comparePasswordAsync,
};
