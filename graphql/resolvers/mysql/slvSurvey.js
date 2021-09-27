const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { processSurveyResult, checkPermission } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');

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
        connectors: { FileSlvSurvey, FileSlvCompanyProfile },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('SURVEY-READ', userRoleList)) throw new ForbiddenError();

      let result = [];
      // company
      const resCompany = await FileSlvCompanyProfile.findById(COMPANY_ID);

      // survey
      const searchOpts = { where: { COMPANY_ID } };
      const res = await FileSlvSurvey.findAll(searchOpts);

      if (res.length !== 0) {
        result = res.map((svy) => {
          const result2 = svy;

          // process result
          const processedResult = processSurveyResult(result2);

          const newResult = {
            ...result2,
            ...processedResult,
            SECTOR: resCompany.SECTOR,
          };

          return newResult;
        });
      }

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
        connectors: { FileSlvSurvey, FileSlvCompanyProfile, FileSlvAssessment },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('SURVEY-READ', userRoleList)) throw new ForbiddenError();

      let where = { CREATED_BY: mail };
      let resultCompany = [];
      let resultQuest = [];
      let resultScore = [];

      // check module admin
      if (userRoleList.DATA_VIEW === 'MODULE') {
        where = { MODULE: userRoleList.MODULE };
      }
      // check admin
      if (userRoleList.MODULE === 'ALL') {
        where = null;
      }
      const searchOpts = { where };

      // Assessment
      const resScore = await FileSlvAssessment.findAll(searchOpts);
      if (resScore.length !== 0) {
        resultScore = resScore
          .filter((oa) => oa.ASSESSMENT_YEAR === 1000);
      }

      // Survey
      const resQuest = await FileSlvSurvey.findAll(searchOpts);
      if (resQuest.length !== 0) {
        resultQuest = resQuest
          .filter((oa) => oa.ASSESSMENT_YEAR === 1000);
      }

      // company
      const resCompany = await FileSlvCompanyProfile.findAll(searchOpts);
      resultCompany = resCompany
        .map((x) => {
          const resC = x;
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

      return resultCompany;
    }),
  },
  Mutation: {
    createSurvey: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { FileSlvSurvey },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('SURVEY-CREATE', userRoleList)) throw new ForbiddenError();

      // process input
      const postInput = processInput(input);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...postInput,
        ID: generateId(),
        ...history,
        COMPANY_ID: input.COMPANY_ID,
        MODULE: userRoleList.MODULE,
        ASSESSMENT_YEAR: 1000,
      };
      const result = await FileSlvSurvey.create(newInput);
      return result;
    }),
    updateSurvey: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { FileSlvSurvey },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('SURVEY-UPDATE', userRoleList)) throw new ForbiddenError();

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
      const result = await FileSlvSurvey.update(searchOpts);
      const result2 = {
        ID: input.COMPANY_ID,
        updated: result[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    }),
  },
};
