const { generateId, generateHistory } = require('../../../packages/mysql-model');
const {
  processSurveyResult, checkPermission, getSMEClass, removeDuplicatesFromArray,
  getRoleWhere, getCurrentData, getFilteredData,
} = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const {
  ForbiddenError, DataNotAnArrayError, InvalidDataError, SurveyExistsError,
} = require('../../permissions/errors');
const logger = require('../../../packages/logger');
const { surveyFlagFields, yesNoObj, commonSurveyFields } = require('../../helper/parameter');

/**
 * Check if survey for current assessment year already exist in DB
 * @param {string} ENTITY_NAME company name
 * @param {object} MysqlSlvSurvey Survey Connector Object
 * @returns {string} N/A
 */
const checkSurveyExist = async (COMPANY_ID, MysqlSlvSurvey) => {
  const searchExistOpts = {
    where: { COMPANY_ID, ASSESSMENT_YEAR: 1000 },
  };
  const resSurvey = await MysqlSlvSurvey.findOne(searchExistOpts);
  const resultSurvey = resSurvey ? resSurvey.dataValues.ID : null;

  if (resultSurvey) {
    logger.error('createSurvey --> Survey already exist');
    throw new SurveyExistsError();
  }
  return 'N/A';
};

/**
 * Process survey input recevived to suit DB schema
 * @param {Object} input survey input
 * @returns processed survey input
 */
const processInput = (input) => {
  const parsedInput = JSON.parse(input.data);

  // validation part
  // check not empty
  commonSurveyFields.forEach((y) => {
    if (!parsedInput[y]) {
      logger.error(`processSurveyInput --> Invalid ${y}`);
      throw new InvalidDataError({ message: `Invalid ${y}` });
    }
  });

  // yes no check for flag
  surveyFlagFields.forEach((y) => {
    if (!parsedInput[y] || !yesNoObj.includes(parsedInput[y].toUpperCase())) {
      logger.error(`processSurveyInput --> Invalid ${y}`);
      throw new InvalidDataError({ message: `Invalid ${y}` });
    }
  });

  // Available system
  if (!Array.isArray(parsedInput.AVAILABLE_SYSTEM)) {
    logger.error('processSurveyInput --> Available System is not an Array');
    throw new DataNotAnArrayError({ message: 'Available System is not an Array' });
  }
  // Marketing Type
  if (!Array.isArray(parsedInput.MARKETING_TYPE)
    && parsedInput.MARKETING_TYPE !== 'Both Marketing') {
    logger.error('processSurveyInput --> Marketing Type is not an Array');
    throw new DataNotAnArrayError({ message: 'Marketing Type is not an Array' });
  }
  // Online Marketing Type
  if ((parsedInput.MARKETING_TYPE.includes('Online Marketing')
    || parsedInput.MARKETING_TYPE === 'Both Marketing')
    && !Array.isArray(parsedInput.ONLINE_MARKETING_TYPE)) {
    logger.error('processSurveyInput --> Online Marketing Type is not an Array');
    throw new DataNotAnArrayError({ message: 'Online Marketing Type is not an Array' });
  }
  // Business Future Plan
  if (!Array.isArray(parsedInput.BUSINESS_FUTURE_PLAN)) {
    logger.error('processSurveyInput --> Business Future Plan is not an Array');
    throw new DataNotAnArrayError({ message: 'Business Future Plan is not an Array' });
  }
  // Seek Financing Method
  if (parsedInput.SEEK_FINANCING_2YEARS_FLAG.toUpperCase() === 'YES'
    && !Array.isArray(parsedInput.SEEK_FINANCING_METHOD)) {
    logger.error('processSurveyInput --> Seek Financing Method is not an Array');
    throw new DataNotAnArrayError({ message: 'Seek Financing Method is not an Array' });
  }
  // Customer Payment Method
  if (!Array.isArray(parsedInput.CUSTOMER_PAYMENT_METHODS)) {
    logger.error('processSurveyInput --> Customer Payment Method is not an Array');
    throw new DataNotAnArrayError({ message: 'Customer Payment Method is not an Array' });
  }
  // Full Time Employee
  const fullTimeEmployeeRegex = /^\d*$/gi;
  if (parsedInput.EMPLOYEE_COUNT_DETAIL
    && !fullTimeEmployeeRegex.test(parsedInput.EMPLOYEE_COUNT_DETAIL.FULLTIME)) {
    logger.error('processSurveyInput --> Invalid Full time Employee');
    throw new InvalidDataError({ message: 'Invalid Full time Employee' });
  }
  // Part Time Employee
  const partTimeEmployeeRegex = /^\d*$/gi;
  if (parsedInput.EMPLOYEE_COUNT_DETAIL
    && !partTimeEmployeeRegex.test(parsedInput.EMPLOYEE_COUNT_DETAIL.PARTTIME)) {
    logger.error('processSurveyInput --> Invalid Part time Employee');
    throw new InvalidDataError({ message: 'Invalid Part time Employee' });
  }

  // handle marketing
  const bothMarketing = JSON.stringify(['Online Marketing', 'Offline Marketing']);
  const marketingType = parsedInput.MARKETING_TYPE === 'Both Marketing'
    ? bothMarketing
    : JSON.stringify(parsedInput.MARKETING_TYPE);

  // handle owner managed 100
  const ownerManaged100 = parsedInput.BUSINESS_OWNER_INVOLVE_PERCENTAGE === '100%' ? 'YES' : 'NO';
  const ownerManaged100Flag = parsedInput.EMPLOYEE_DETAILS
    ? parsedInput.EMPLOYEE_DETAILS.OWNER_MANAGED_100
    : ownerManaged100;

  // generic process input
  const processedInput = {
    AVAILABLE_SYSTEM: JSON.stringify(parsedInput.AVAILABLE_SYSTEM),
    MARKETING_TYPE: marketingType,
    ONLINE_MARKETING_TYPE: parsedInput.ONLINE_MARKETING_TYPE
      ? JSON.stringify(parsedInput.ONLINE_MARKETING_TYPE)
      : '[]',
    BUSINESS_FUTURE_PLAN: JSON.stringify(parsedInput.BUSINESS_FUTURE_PLAN),
    SEEK_FINANCING_METHOD: parsedInput.SEEK_FINANCING_METHOD
      ? JSON.stringify(parsedInput.SEEK_FINANCING_METHOD)
      : '[]',
    CUSTOMER_PAYMENT_METHODS: JSON.stringify(parsedInput.CUSTOMER_PAYMENT_METHODS),
    FULLTIME_EMPLOYEE_COUNT: parsedInput.EMPLOYEE_COUNT_DETAIL.FULLTIME,
    PARTTIME_EMPLOYEE_COUNT: parsedInput.EMPLOYEE_COUNT_DETAIL.PARTTIME,
    OWNER_MANAGED_100: ownerManaged100Flag,
  };

  // handle missing class
  const smeClassInput = getSMEClass(
    parsedInput.SECTOR,
    parsedInput.EMPLOYEE_COUNT_DETAIL.FULLTIME,
    parsedInput.BUSINESS_OWNER_INVOLVE_PERCENTAGE,
    parsedInput.ANNUAL_TURNOVER,
  );

  // combine input
  const postInput = {
    ...parsedInput,
    ...processedInput,
    ...smeClassInput,
  };
  return postInput;
};

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allSurvey: isAuthenticatedResolver.createResolver(async (
      parent, { COMPANY_ID }, {
        connectors: { MysqlSlvSurvey, MysqlSlvCompanyProfile },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`allSurvey --> by ${mail} input: ${COMPANY_ID}`);

      if (!checkPermission('SURVEY-READ', userRoleList)) {
        logger.error('allSurvey --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('allSurvey --> Permission check passed');

      let result = [];
      // company
      const resCompany = await MysqlSlvCompanyProfile.findById(COMPANY_ID);
      logger.debug(`allSurvey --> company found: ${JSON.stringify(resCompany)}`);

      // survey
      const searchOpts = { where: { COMPANY_ID } };
      const res = await MysqlSlvSurvey.findAll(searchOpts);
      logger.debug(`allSurvey --> survey found: ${JSON.stringify(res)}`);

      if (res.length !== 0) {
        result = res.map((svy) => {
          const result2 = svy.dataValues;

          // process result
          const processedResult = processSurveyResult(result2);

          const newResult = {
            ...result2,
            ...processedResult,
            SECTOR: resCompany.dataValues.SECTOR,
          };

          return newResult;
        });
      }

      logger.debug(`allSurvey --> output: ${JSON.stringify(result)}`);
      logger.info(`allSurvey --> by ${mail} completed`);

      return result;
    }),
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.filter filter to be applied
         */
    smeScatter: isAuthenticatedResolver.createResolver(async (
      parent, { filter },
      {
        connectors: { MysqlSlvSurvey, MysqlSlvCompanyProfile, MysqlSlvAssessment },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`smeScatter --> by ${mail} called with filter ${JSON.stringify(filter)}`);

      if (!checkPermission('SURVEY-READ', userRoleList)) {
        logger.error('smeScatter --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('smeScatter --> Permission check passed');

      let resultCompany = [];

      const where = getRoleWhere(userRoleList, mail);
      const searchOpts = { where };
      const searchOptsAll = { where: null };

      // Assessment
      const resultScore = await getCurrentData(
        MysqlSlvAssessment, searchOptsAll, 'smeScatter', 'assessment',
      );

      // Survey
      const resultQuest = await getCurrentData(
        MysqlSlvSurvey, searchOptsAll, 'smeScatter', 'survey',
      );

      // company
      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      logger.debug(`smeScatter --> company found: ${JSON.stringify(resCompany)}`);

      resultCompany = resCompany
        .map((x) => {
          const resC = x.dataValues;
          const resQ = resultQuest.filter((y) => y.COMPANY_ID === resC.ID);
          const resS = resultScore.filter((z) => z.COMPANY_ID === resC.ID);

          const resQ1 = resQ.length !== 0 ? resQ[0] : null;
          const resS1 = resS.length !== 0 ? resS[0] : null;

          return {
            ...resC,
            ...resQ1,
            ...resS1,
            SURVEY_DONE: resQ.length,
            ASSESSMENT_DONE: resS.length,
          };
        })
        .filter((cls) => cls.SME_CLASS && cls.SME_CLASS !== 'LARGE ENTERPRISE' && cls.SME_CLASS !== 'N/A')
        .filter(((as) => as.SURVEY_DONE !== 0));

      resultCompany = getFilteredData(resultCompany, filter);

      const resultFinal = resultCompany.map((f) => ({
        COMPANY_ID: f.ID,
        SECTOR: f.SECTOR,
        ANNUAL_TURNOVER: f.ANNUAL_TURNOVER && f.ANNUAL_TURNOVER > 0 ? f.ANNUAL_TURNOVER : 0,
        FULLTIME_EMPLOYEE_COUNT: f.FULLTIME_EMPLOYEE_COUNT ? f.FULLTIME_EMPLOYEE_COUNT : 0,
        SME_CLASS: f.SME_CLASS ? f.SME_CLASS : 'N/A',
        ASSESSMENT_DONE: f.ASSESSMENT_DONE,
      }));

      logger.debug(`smeScatter --> output: ${JSON.stringify(resultCompany)}`);
      logger.info(`smeScatter --> by ${mail} completed`);

      return resultFinal;
    }),
    /**
         * Get group by data based on column
         * @param {Object} param0 main input object
         * @param {String} param0.COLUMN column to be aggregated
         * @param {Object} param0.filter filter to be applied
         */
    surveyField: isAuthenticatedResolver.createResolver(async (
      parent, { COLUMN, filter },
      {
        connectors: {
          MysqlSlvSurvey, MysqlSlvCompanyProfile, MysqlSlvAssessment, MysqlSlvMSIC,
        },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`surveyField --> by ${mail} called with input ${COLUMN} and filter ${filter}`);

      if (!checkPermission('SURVEY-READ', userRoleList)) {
        logger.error('surveyField --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('surveyField --> Permission check passed');

      let resultCompany = [];
      let resultMSIC = [];

      const where = getRoleWhere(userRoleList, mail);
      const searchOpts = { where };
      const searchOptsAll = { where: null };

      // MSIC if needed
      if (COLUMN === 'SECTION'
      || COLUMN === 'DIVISION'
      || COLUMN === 'GROUP'
      || COLUMN === 'CLASS'
      || COLUMN === 'MSIC') {
        const resMSIC = await MysqlSlvMSIC.findAll(searchOptsAll);
        resultMSIC = resMSIC.map((x) => x.dataValues);
      }

      // Assessment
      const resultScore = await getCurrentData(
        MysqlSlvAssessment, searchOptsAll, 'surveyField', 'assessment',
      );

      // Survey
      const resultQuest = await getCurrentData(
        MysqlSlvSurvey, searchOptsAll, 'surveyField', 'survey',
      );

      // company
      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      logger.debug(`surveyField --> company found: ${JSON.stringify(resCompany)}`);

      resultCompany = resCompany
        .map((x) => {
          const resC = x.dataValues;
          const resQ = resultQuest.filter((y) => y.COMPANY_ID === resC.ID);
          const resS = resultScore.filter((z) => z.COMPANY_ID === resC.ID);

          const resQ1 = resQ.length !== 0 ? resQ[0] : null;
          const resS1 = resS.length !== 0 ? resS[0] : null;

          return {
            ...resQ1,
            ...resS1,
            ...resC,
            SURVEY_DONE: resQ.length,
            ASSESSMENT_DONE: resS.length,
          };
        })
        .filter((cls) => cls.SME_CLASS && cls.SME_CLASS !== 'LARGE ENTERPRISE' && cls.SME_CLASS !== 'N/A')
        .filter((as) => as.SURVEY_DONE !== 0);

      resultCompany = getFilteredData(resultCompany, filter);

      // filter column
      resultCompany = resultCompany.map((c) => c[COLUMN])
        .map((up) => (up ? up.toUpperCase() : up));

      const uniqueColumn = removeDuplicatesFromArray(resultCompany);
      const data = uniqueColumn.map((uc) => {
        const res = resultCompany.filter((rc) => rc === uc);
        return {
          KEY: uc,
          VALUE: res.length,
        };
      });

      const finalResult = {
        data,
        total: resultCompany.length,
        column: COLUMN,
        MSIC: resultMSIC,
      };

      logger.debug(`surveyField --> output: ${JSON.stringify(resultCompany)}`);
      logger.info(`surveyField --> by ${mail} completed`);

      return finalResult;
    }),
  },
  Mutation: {
    createSurvey: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvSurvey, MysqlSlvUserPublic },
        user: { mail, userType, userRoleList },
      },
    ) => {
      logger.info(`createSurvey --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('SURVEY-CREATE', userRoleList)) {
        logger.error('createSurvey --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('createSurvey --> Permission check passed');

      await checkSurveyExist(input.COMPANY_ID, MysqlSlvSurvey);

      // process input
      const postInput = processInput(input);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...postInput,
        ID: generateId(),
        ...history,
        COMPANY_ID: input.COMPANY_ID,
        MODULE: userRoleList.MODULE === 'ALL' ? 'SME' : userRoleList.MODULE,
        ASSESSMENT_YEAR: 1000,
      };
      const resSurvey = await MysqlSlvSurvey.create(newInput);
      const resultSurvey = resSurvey.dataValues;

      // if public user, update survey ID in profile
      if (userType === 10) {
        logger.debug('createSurvey --> Created by public user. Update survey id');
        // find user ID
        const searchOpts = {
          where: { EMAIL: mail },
        };
        const resUser = await MysqlSlvUserPublic.findOne(searchOpts);
        const resultUser = resUser.dataValues;

        // update user
        const historyUpdate = generateHistory(mail, 'UPDATE', resUser.dataValues.CREATED_AT);
        const searchOptsUpdate = {
          object: {
            ...resultUser,
            SURVEY_ID: resultSurvey.ID,
            ...historyUpdate,
          },
          where: {
            EMAIL: mail,
          },
        };
        await MysqlSlvUserPublic.update(searchOptsUpdate);
      }

      logger.debug(`createSurvey --> output: ${JSON.stringify(resultSurvey)}`);
      logger.info(`createSurvey --> by ${mail} completed`);

      return resultSurvey;
    }),
    updateSurvey: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvSurvey },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`updateSurvey --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('SURVEY-UPDATE', userRoleList)) {
        logger.error('updateSurvey --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('updateSurvey --> Permission check passed');

      // process input
      const postInput = processInput(input);

      // store new entry
      const history = generateHistory(mail, 'UPDATE', postInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...postInput,
          ...history,
        },
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
        },
      };
      const result = await MysqlSlvSurvey.update(searchOpts);
      logger.debug(`updateSurvey --> survey found: ${JSON.stringify(result)}`);

      const result2 = {
        ID: input.COMPANY_ID,
        updated: result[0],
      };
      // console.dir(result2, { depth: null, colorized: true });

      logger.debug(`updateSurvey --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateSurvey --> by ${mail} completed`);

      return result2;
    }),
  },
};
