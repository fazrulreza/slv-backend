const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { processSurveyResult } = require('../../helper/common');

const processInput = (input) => {
  const parsedInput = JSON.parse(input.data);
  const processedInput = {
    AVAILABLE_SYSTEM: JSON.stringify(parsedInput.AVAILABLE_SYSTEM),
    MARKETING_TYPE: JSON.stringify(parsedInput.MARKETING_TYPE),
    ONLINE_MARKETING_TYPE: parsedInput.SEEK_FINANCING_METHOD
      ? JSON.stringify(parsedInput.ONLINE_MARKETING_TYPE)
      : [],
    BUSINESS_FUTURE_PLAN: JSON.stringify(parsedInput.BUSINESS_FUTURE_PLAN),
    SEEK_FINANCING_METHOD: parsedInput.SEEK_FINANCING_METHOD
      ? JSON.stringify(parsedInput.SEEK_FINANCING_METHOD)
      : [],
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
    oneSurvey: async (parent,
      { COMPANY_ID },
      { connectors: { MysqlSlvSurvey, MysqlSlvCompanyProfile } }) => {
      const searchOpts = { where: { COMPANY_ID } };
      const res = await MysqlSlvSurvey.findOne(searchOpts);
      const result = res.dataValues;

      const resCompany = await MysqlSlvCompanyProfile.findOne(COMPANY_ID);

      // process result
      const processedResult = processSurveyResult(result);

      const newResult = {
        ...result,
        ...processedResult,
        SECTOR: resCompany.dataValues.SECTOR,
      };

      return newResult;
    },
  },
  Mutation: {
    createSurvey:
      async (parent, { input }, { connectors: { MysqlSlvSurvey } }) => {
        // process input
        const postInput = processInput(input);

        const history = generateHistory(input.name, 'CREATE');
        const newInput = {
          ...postInput,
          ID: generateId(),
          ...history,
          COMPANY_ID: input.COMPANY_ID,
        };
        // console.log(newInput);
        const result = await MysqlSlvSurvey.create(newInput);
        return result;
      },
    updateSurvey: async (
      parent,
      { input },
      { connectors: { MysqlSlvSurvey, MysqlSlvSurveyHistory } },
    ) => {
      const postInput = processInput(input);

      // store previous entry
      const searchOptsHist = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resHist = await MysqlSlvSurvey.findOne(searchOptsHist);
      const histInput = resHist.dataValues;
      const historyHist = generateHistory(input.name, 'CREATE', histInput.CREATED_AT);
      const finalHist = {
        ...histInput,
        ...historyHist,
        ID: generateId(),
      };
      await MysqlSlvSurveyHistory.create(finalHist);

      // store new entry
      const history = generateHistory(input.name, 'UPDATE', postInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...postInput,
          ...history,
        },
        where: {
          COMPANY_ID: input.COMPANY_ID,
        },
      };
      const result = await MysqlSlvSurvey.update(searchOpts);
      const result2 = {
        ID: input.COMPANY_ID,
        updated: result[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    },
  },
};
