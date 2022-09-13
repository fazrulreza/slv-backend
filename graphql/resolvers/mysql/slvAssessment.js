const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { processSurveyResult, checkPermission } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError, AssessmentExistsError, InvalidDataError } = require('../../permissions/errors');
const logger = require('../../../packages/logger');
const { assessmentIntObj } = require('../../helper/parameter');

/**
 * Check if assessment for current assessment year already exist in DB
 * @param {string} ENTITY_NAME company name
 * @param {object} MysqlSlvSurvey Survey Connector Object
 * @returns {string} N/A
 */
const checkAssessmentExist = async (COMPANY_ID, MysqlSlvAssessment) => {
  const searchExistOpts = {
    where: { COMPANY_ID, ASSESSMENT_YEAR: 3000 },
  };
  const resAssessment = await MysqlSlvAssessment.findOne(searchExistOpts);
  const resultAssessment = resAssessment ? resAssessment.dataValues.ID : null;

  if (resultAssessment) {
    logger.error('createAssessment --> Survey already exist');
    throw new AssessmentExistsError();
  }
  return 'N/A';
};

/**
 * Validate Assessment Object
 * @param {Object} input main input object
 */
const checkAssessmentDetails = (input) => {
  // eslint-disable-next-line no-unused-vars
  const flagCheckObj = assessmentIntObj.map((y) => {
    const regexIntValue = /^[1-6]/gi;
    if (!input[y] || !regexIntValue.test(input[y])) {
      logger.error(`checkAssessmentDetails --> Invalid ${y}`);
      throw new InvalidDataError({ message: `Invalid ${y}` });
    }
    return 'pass';
  });
};

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allAssessment: isAuthenticatedResolver.createResolver(async (parent, { COMPANY_ID }, {
      connectors: { MysqlSlvSurvey, MysqlSlvAssessment },
      user: { mail, userRoleList },
    }) => {
      logger.info(`allAssessment --> by ${mail} input: ${COMPANY_ID}`);

      if (!checkPermission('ASSESSMENT-READ', userRoleList)) {
        logger.error('allAssessment --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('allAssessment --> Permission check passed');

      let resultQuest = [];
      let resultScore = [];

      const searchOpts = { where: { COMPANY_ID } };

      // survey
      const resQuest = await MysqlSlvSurvey.findAll(searchOpts);
      if (resQuest.length !== 0) {
        logger.debug(`allAssessment --> Survey data found for ${COMPANY_ID}`);
        resultQuest = resQuest.map((svy) => {
          const result2 = svy.dataValues;

          // process result
          const processedResult = processSurveyResult(result2);

          const newResult = {
            ...result2,
            ...processedResult,
          };

          return newResult;
        });
      }

      // assessment
      const resScore = await MysqlSlvAssessment.findAll(searchOpts);
      if (resScore.length !== 0) {
        resultScore = resScore.map((asmt) => ({
          ...asmt.dataValues,
          MODULE: JSON.parse(asmt.dataValues.MODULE),
        }));
        logger.debug(`allAssessment --> Assessment data found for ${COMPANY_ID}`);
      }

      const result = {
        assessment: resultScore,
        survey: resultQuest,
      };

      logger.debug(`allAssessment --> output: ${JSON.stringify(result)}`);
      logger.info(`allAssessment --> by ${mail} completed`);

      return result;
    }),
  },
  Mutation: {
    createAssessment: isAuthenticatedResolver.createResolver(async (parent, { input }, {
      connectors: { MysqlSlvAssessment },
      user: { mail, userRoleList },
    }) => {
      logger.info(`createAssessment --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('ASSESSMENT-CREATE', userRoleList)) {
        logger.error('createAssessment --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('createAssessment --> Permission check passed');

      await checkAssessmentExist(input.COMPANY_ID, MysqlSlvAssessment);

      // process input
      const parsedInput = JSON.parse(input.data);
      checkAssessmentDetails(parsedInput);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...parsedInput,
        ID: generateId(),
        ...history,
        COMPANY_ID: input.COMPANY_ID,
        MODULE: JSON.stringify(parsedInput.MODULE),
        ASSESSMENT_YEAR: 1000,
      };
      // console.log(newInput);
      const result = await MysqlSlvAssessment.create(newInput);

      logger.debug(`createAssessment --> output: ${JSON.stringify(result)}`);
      logger.info(`createAssessment --> by ${mail} completed`);
      return result;
    }),
    updateAssessment: isAuthenticatedResolver.createResolver(async (parent, { input }, {
      connectors: { MysqlSlvAssessment },
      user: { mail, userRoleList },
    }) => {
      logger.info(`updateAssessment --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('ASSESSMENT-UPDATE', userRoleList)) {
        logger.error('updateAssessment --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('updateAssessment --> Permission check passed');

      const parsedInput = JSON.parse(input.data);
      checkAssessmentDetails(parsedInput);

      // store new entry
      const history = generateHistory(mail, 'UPDATE', parsedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...parsedInput,
          MODULE: JSON.stringify(parsedInput.MODULE),
          ...history,
        },
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
        },
      };
      const result = await MysqlSlvAssessment.update(searchOpts);
      const result2 = {
        ID: input.COMPANY_ID,
        updated: result[0],
      };

      logger.debug(`updateAssessment --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateAssessment --> by ${mail} completed`);
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    }),
  },
};
