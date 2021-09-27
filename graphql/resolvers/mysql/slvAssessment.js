const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { processSurveyResult, checkPermission } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allAssessment: isAuthenticatedResolver.createResolver(async (
      parent, { COMPANY_ID }, {
        connectors: { FileSlvSurvey, FileSlvAssessment },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('ASSESSMENT-READ', userRoleList)) throw new ForbiddenError();

      let resultQuest = [];
      let resultScore = [];

      const searchOpts = { where: { COMPANY_ID } };

      // survey
      const resQuest = await FileSlvSurvey.findAll(searchOpts);
      if (resQuest.length !== 0) {
        resultQuest = resQuest.map((svy) => {
          const result2 = svy;

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
      const resScore = await FileSlvAssessment.findAll(searchOpts);
      if (resScore.length !== 0) resultScore = resScore;

      const result = {
        assessment: resultScore,
        survey: resultQuest,
      };

      return result;
    }),
  },
  Mutation: {
    createAssessment: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { FileSlvAssessment },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('ASSESSMENT-CREATE', userRoleList)) throw new ForbiddenError();

      // process input
      const parsedInput = JSON.parse(input.data);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...parsedInput,
        ID: generateId(),
        ...history,
        COMPANY_ID: input.COMPANY_ID,
        MODULE: userRoleList.MODULE,
        ASSESSMENT_YEAR: 1000,
      };
        // console.log(newInput);
      const result = await FileSlvAssessment.create(newInput);
      return result;
    }),
    updateAssessment: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { FileSlvAssessment },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('ASSESSMENT-UPDATE', userRoleList)) throw new ForbiddenError();

      const parsedInput = JSON.parse(input.data);

      // store new entry
      const history = generateHistory(mail, 'UPDATE', parsedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...parsedInput,
          ...history,
        },
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
        },
      };
      const result = await FileSlvAssessment.update(searchOpts);
      const result2 = {
        ID: input.COMPANY_ID,
        updated: result[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    }),
  },
};
