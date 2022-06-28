/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
const jwt = require('jsonwebtoken');
const { readFileSync } = require('fs');
const { Op } = require('sequelize');
const path = require('path');
const bcrypt = require('bcrypt');
const { profileGroup, tieredInterventionGroup, smeSizeChoice } = require('./parameter');
const logger = require('../../packages/logger');

const SECRET = readFileSync(path.join(__dirname, process.env.SECRET));
const SECRET_PUB = readFileSync(path.join(__dirname, process.env.SECRET_PUB));

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

// /**
//  * Get difference between current and historical data
//  * @param {Object} curr current data
//  * @param {Object} hist historical data
//  * @returns {Object} difference
//  */
// const getDifference = (curr, hist) => Object.entries(hist)
//   .filter(([key, val]) => curr[key] !== val && key in curr)
//   .reduce((acc, [key, v]) => ({ ...acc, [key]: v }), {});

/**
 * Remove duplicates from Array
 * @param {Object []} arr array
 * @returns Unique array object
 */
const removeDuplicatesFromArray = (arr) => [...new Set(arr.map((el) => JSON.stringify(el)))]
  .map((e) => JSON.parse(e));

/**
 * Process survey data from DB to suit response e.g. parsing JSON
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

// /**
//  * Remove Empty entries in object
//  * @param {Object} obj Object to be processed
//  * @returns Object without empty entries
//  */
// const cleanEmpty = (obj) => {
//   if (Array.isArray(obj)) {
//     return obj
//       .map((v) => ((v && typeof v === 'object') ? cleanEmpty(v) : v))
//       .filter((v) => !(v == null));
//   }
//   return Object.entries(obj)
//     .map(([k, v]) => [k, v && typeof v === 'object' ? cleanEmpty(v) : v])
//     .reduce((a, [k, v]) => ((v === null || v.length === 0) ? a : (a[k] = v, a)), {});
//   // || Object.values(v).length === 0)
// };

/**
 * Calculate ELSA sub factor scores and its paramater
 * @param {Object} getClassScore Object containing ELSA scores
 * @param {string} initial type of data to be calculated
 * @param {number} year assessment year
 * @returns {Object} ELSA items
 */
const calculateScores = (getClassScore, initial, year) => {
  const tempGroup = getClassScore
    .filter((x) => Object.keys(x)[0].startsWith(initial)) // filter by initial
    .filter((y) => !Object.keys(y)[0].endsWith('COMMENT')) // remove comment fields
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
  return finalGroup;
};

/**
 * Calculate KPI total score
 * @param {Object} scorecard contains all the scores for KPI
 * @returns {number} total scores of KPI
 */
const getTotalScore = (scorecard) => {
  const sumScore = scorecard
    .reduce(((acc, v) => (v.FINAL_SCORE === 'N/A' ? acc : acc + parseFloat(v.FINAL_SCORE))), 0);
  const countScore = scorecard
    .reduce(((acc, v) => (v.FINAL_SCORE === 'N/A' ? acc : acc + 1)), 0);
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
        username: err.name,
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

/**
 * Generate where part for sequelize find based on role
 * @param {Object} userRoleList user Role List
 * @param {string} mail user mail
 * @param {string} column column to search
 * @returns {Object} where object to be used in sequelize find
 */
const getRoleWhere = (userRoleList, mail, column = 'CREATED_BY') => {
  switch (true) {
    case (userRoleList.DATA_VIEW === 'OWN'):
      return { [column]: mail };
    case (userRoleList.DATA_VIEW === 'MODULE'):
      return { MODULE: { [Op.substring]: userRoleList.MODULE } };
    case (userRoleList.DATA_VIEW === 'ALL'):
      return null;
    default:
      return { [column]: mail };
  }
};

/**
 * Get sme size based only on number of staff
 * @param {string} sector sector
 * @param {number} value no of staff
 * @returns {number} value for sme size
 */
const getSMEStaff = (sector, value) => {
  switch (true) {
    case (sector === 'MANUFACTURING' && (value > 200)):
    case (sector !== 'MANUFACTURING' && (value > 75)):
      return 5;
    case (sector === 'MANUFACTURING' && (value >= 75 && value <= 200)):
    case (sector !== 'MANUFACTURING' && (value >= 30 && value <= 75)):
      return 4;
    case (sector === 'MANUFACTURING' && (value >= 5 && value < 75)):
    case (sector !== 'MANUFACTURING' && (value >= 5 && value < 30)):
      return 3;
    case (value > 1 && value < 5):
      return 2;
    case (value === 1):
      return 1;
    default:
      return 0;
  }
};

/**
 * Get sme size based only on revenue
 * @param {String} sector sector
 * @param {number} value revenue
 * @returns {number}
 */
const getSMERevenue = (sector, value) => {
  switch (true) {
    case (sector === 'MANUFACTURING' && (value > 50000000)):
    case (sector !== 'MANUFACTURING' && (value > 20000000)):
      return 5;
    case (sector === 'MANUFACTURING' && (value >= 15000000 && value <= 50000000)):
    case (sector !== 'MANUFACTURING' && (value >= 3000000 && value <= 20000000)):
      return 4;
    case (sector === 'MANUFACTURING' && (value >= 300000 && value < 15000000)):
    case (sector !== 'MANUFACTURING' && (value >= 300000 && value < 3000000)):
      return 3;
    case (value >= 150000 && value < 300000):
      return 2;
    case (value < 150000):
      return 1;
    default:
      return 0;
  }
};

/**
 * Get SME size based on both revenue and number of staff
 * @param {String} SECTOR Sector
 * @param {number} FULLTIME fulltime employee
 * @param {String} BUSINESS_OWNER_INVOLVE_PERCENTAGE business owner involvement
 * @param {number} ANNUAL_TURNOVER annual turnover
 * @returns {Object} sales turnover and sme class
 */
const getSMEClass = (
  SECTOR, FULLTIME, BUSINESS_OWNER_INVOLVE_PERCENTAGE, ANNUAL_TURNOVER,
) => {
  let classValue;
  let salesValue;

  const OWNER_MANAGED_100 = BUSINESS_OWNER_INVOLVE_PERCENTAGE === '100%' ? 'YES' : 'NO';

  const preStaff = getSMEStaff(SECTOR, FULLTIME);
  const preRevenue = getSMERevenue(SECTOR, ANNUAL_TURNOVER);
  const biggerSize = Math.max(preStaff, preRevenue);

  switch (true) {
    case (preStaff === 1 && preRevenue === 1 && OWNER_MANAGED_100 === 'NO'):
      classValue = smeSizeChoice[2].classValue;
      salesValue = smeSizeChoice[2].salesValue;
      break;
    case preStaff === preRevenue:
      classValue = smeSizeChoice[preStaff].classValue;
      salesValue = smeSizeChoice[preStaff].salesValue;
      break;
    case preStaff !== preRevenue:
      classValue = smeSizeChoice[biggerSize].classValue;
      salesValue = smeSizeChoice[biggerSize].salesValue;
      break;
    default:
      classValue = 'NON-SME';
      salesValue = 0;
      break;
  }

  return {
    SALES_TURNOVER: salesValue,
    SME_CLASS: classValue,
  };
};

/**
 * Generic DB query helper for getting data for current year
 * @param {Object} connector connector object to DB
 * @param {Object} searchOpts search options
 * @param {string} process process name
 * @param {string} type type of data
 * @returns {Object} data
 */
const getCurrentData = async (connector, searchOpts, process, type) => {
  let finalData = [];

  const tempData = await connector.findAll(searchOpts);
  if (tempData.length !== 0) {
    finalData = tempData
      .map((s) => s.dataValues)
      .filter((oa) => oa.ASSESSMENT_YEAR === 1000);
  }
  logger.debug(`${process} --> total ${type} found: ${finalData.length}`);
  return finalData;
};

/**
 * Filter data based on specified filter
 * @param {Object} data main data
 * @param {Object} filter filter to be applied
 * @returns
 */
const getFilteredData = (data, filter) => {
  let finalData = data;

  if (filter) {
    const newFilter = JSON.parse(filter);
    finalData = data
      .filter((item) => Object.entries(newFilter).every(([key, value]) => item[key] === value));
  }
  return finalData;
};

/**
 * Check if URL isa valid or not
 * @param {string} urlString url
 * @returns {boolean}
 */
const isValidUrl = (urlString) => {
  let url;

  try {
    url = new URL(urlString);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
};

module.exports = {
  // getFilter,
  // getDifference,
  processSurveyResult,
  // cleanEmpty,
  calculateScores,
  getTotalScore,
  processUserRolesOutput,
  checkPermission,
  verifyToken,
  signToken,
  hashPasswordAsync,
  comparePasswordAsync,
  getRoleWhere,
  getSMEClass,
  removeDuplicatesFromArray,
  getCurrentData,
  getFilteredData,
  isValidUrl,
};
