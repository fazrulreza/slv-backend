const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { processSurveyResult } = require('../../helper/common');
const { surveyResolver, companySurveyResolver } = require('../../permissions/acl');

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
    allSurvey: companySurveyResolver.createResolver(async (
      parent,
      { COMPANY_ID },
      { connectors: { MysqlSlvSurvey, MysqlSlvCompanyProfile } }) => {
      let result = [];
      // company
      const resCompany = await MysqlSlvCompanyProfile.findOne(COMPANY_ID);

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
    fullSurveyList: companySurveyResolver.createResolver(async (
      parent, param,
      {
        connectors: { MysqlSlvSurvey, MysqlSlvCompanyProfile },
        user: { mail, userType },
      }) => {
      let result = [];
      let where = { CREATED_BY: mail };

      // check admin
      if (userType === 'ADMIN') {
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
            .filter(g => g.ID === result2.COMPANY_ID)
            .map(h => h.SECTOR)[0];

          const newResult = {
            ...result2,
            ...processedResult,
            SECTOR,
          };

          return newResult;
        });
      }

      // filter large enterprise
      const finalResult = result.filter(cls => cls.SME_CLASS !== 'LARGE ENTERPRISE');

      return finalResult;
    }),
  },
  Mutation: {
    createSurvey: surveyResolver.createResolver(async (
      parent, { input }, { connectors: { MysqlSlvSurvey }, user }) => {
      // process input
      const postInput = processInput(input);

      const history = generateHistory(user.mail, 'CREATE');
      const newInput = {
        ...postInput,
        ID: generateId(),
        ...history,
        COMPANY_ID: input.COMPANY_ID,
        ASSESSMENT_YEAR: 1000,
      };
      const result = await MysqlSlvSurvey.create(newInput);
      return result;
    }),
    updateSurvey: surveyResolver.createResolver(async (
      parent, { input }, { connectors: { MysqlSlvSurvey }, user },
    ) => {
      const postInput = processInput(input);

      // store new entry
      const history = generateHistory(user.mail, 'UPDATE', postInput.CREATED_AT);
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
