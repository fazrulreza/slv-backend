const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { processSurveyResult, checkPermission, getRoleWhere } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');
const logger = require('../../../packages/logger');

const processInput = (input) => {
  const parsedInput = JSON.parse(input.data);
  const processedInput = {
    AVAILABLE_SYSTEM: JSON.stringify(parsedInput.AVAILABLE_SYSTEM),
    MARKETING_TYPE: JSON.stringify(parsedInput.MARKETING_TYPE),
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
    OWNER_MANAGED_100: parsedInput.EMPLOYEE_DETAILS.OWNER_MANAGED_100,
  };
  // combine input
  const postInput = {
    ...parsedInput,
    ...processedInput,
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
         * @param {String} param0.id id
         */
    smeScatter: isAuthenticatedResolver.createResolver(async (
      parent, param,
      {
        connectors: { MysqlSlvSurvey, MysqlSlvCompanyProfile, MysqlSlvAssessment },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`smeScatter --> by ${mail} called with no input`);

      if (!checkPermission('SURVEY-READ', userRoleList)) {
        logger.error('smeScatter --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('smeScatter --> Permission check passed');

      let resultCompany = [];
      let resultQuest = [];
      let resultScore = [];

      const where = getRoleWhere(userRoleList, mail);
      const searchOpts = { where };

      // Assessment
      const resScore = await MysqlSlvAssessment.findAll(searchOpts);
      logger.debug(`smeScatter --> assessment found: ${JSON.stringify(resScore)}`);
      if (resScore.length !== 0) {
        resultScore = resScore
          .map((a) => a.dataValues)
          .filter((oa) => oa.ASSESSMENT_YEAR === 1000);
      }

      // Survey
      const resQuest = await MysqlSlvSurvey.findAll(searchOpts);
      logger.debug(`smeScatter --> survey found: ${JSON.stringify(resQuest)}`);
      if (resQuest.length !== 0) {
        resultQuest = resQuest
          .map((s) => s.dataValues)
          .filter((oa) => oa.ASSESSMENT_YEAR === 1000);
      }

      // company
      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      logger.debug(`smeScatter --> company found: ${JSON.stringify(resCompany)}`);
      resultCompany = resCompany
        .map((x) => {
          const resC = x.dataValues;
          const resQ = resultQuest.filter((y) => y.COMPANY_ID === resC.ID);
          const resS = resultScore.filter((z) => z.COMPANY_ID === resC.ID);
          return {
            COMPANY_ID: resC.ID,
            SECTOR: resC.SECTOR,
            ANNUAL_TURNOVER: resQ.length !== 0 ? resQ[0].ANNUAL_TURNOVER : 0,
            FULLTIME_EMPLOYEE_COUNT: resQ.length !== 0 ? resQ[0].FULLTIME_EMPLOYEE_COUNT : 0,
            SME_CLASS: resQ.length !== 0 ? resQ[0].SME_CLASS : 'N/A',
            ASSESSMENT_DONE: resS.length,
          };
        })
        .filter((cls) => cls.SME_CLASS !== 'LARGE ENTERPRISE' && cls.SME_CLASS !== 'N/A')
        .filter(((as) => as.ASSESSMENT_DONE !== 0));

      logger.debug(`smeScatter --> output: ${JSON.stringify(resultCompany)}`);
      logger.info(`smeScatter --> by ${mail} completed`);

      return resultCompany;
    }),
  },
  Mutation: {
    createSurvey: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvSurvey },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`createSurvey --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('SURVEY-CREATE', userRoleList)) {
        logger.error('createSurvey --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('createSurvey --> Permission check passed');

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
      const result = await MysqlSlvSurvey.create(newInput);

      logger.debug(`createSurvey --> output: ${JSON.stringify(result)}`);
      logger.info(`createSurvey --> by ${mail} completed`);

      return result;
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
