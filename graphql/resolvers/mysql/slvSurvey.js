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
        connectors: { MysqlSlvSurvey, MysqlSlvCompanyProfile },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('SURVEY-READ', userRoleList)) throw new ForbiddenError();

      let result = [];
      // company
      const resCompany = await MysqlSlvCompanyProfile.findById(COMPANY_ID);

      // survey
      const searchOpts = { where: { COMPANY_ID } };
      const res = await MysqlSlvSurvey.findAll(searchOpts);

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

      return result;
    }),
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    fullSurveyList: isAuthenticatedResolver.createResolver(async (
      parent, param,
      {
        connectors: { MysqlSlvSurvey, MysqlSlvCompanyProfile },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('SURVEY-READ', userRoleList)) throw new ForbiddenError();

      let result = [];
      let where = { CREATED_BY: mail };

      // check module admin
      if (userRoleList.DATA_VIEW === 'MODULE') {
        where = { MODULE: userRoleList.MODULE };
      }
      // check admin
      if (userRoleList.MODULE === 'ALL') {
        where = null;
      }
      const searchOpts = { where };

      // company
      const resCom = await MysqlSlvCompanyProfile.findAll(searchOpts);

      // survey
      const res = await MysqlSlvSurvey.findAll(searchOpts);

      if (res.length !== 0) {
        result = res.map((svy) => {
          const result2 = svy.dataValues;

          // process result
          const processedResult = processSurveyResult(result2);
          const SECTOR = resCom
            .filter((g) => g.ID === result2.COMPANY_ID)
            .map((h) => h.SECTOR)[0];

          const newResult = {
            ...result2,
            ...processedResult,
            SECTOR,
          };

          return newResult;
        });
      }

      // filter large enterprise
      const finalResult = result
        .filter((cls) => cls.SME_CLASS !== 'LARGE ENTERPRISE' && cls.SME_CLASS !== 'N/A');

      return finalResult;
    }),
  },
  Mutation: {
    createSurvey: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvSurvey },
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
      const result = await MysqlSlvSurvey.create(newInput);
      return result;
    }),
    updateSurvey: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvSurvey },
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
      const result = await MysqlSlvSurvey.update(searchOpts);
      const result2 = {
        ID: input.COMPANY_ID,
        updated: result[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    }),
  },
};
