const { generateId, generateHistory } = require('../../../packages/mysql-model');

const processInput = (input) => {
  const parsedInput = JSON.parse(input.data);
  const processedInput = {
    AVAILABLE_SYSTEM: JSON.stringify(parsedInput.AVAILABLE_SYSTEM),
    MARKETING_TYPE: JSON.stringify(parsedInput.MARKETING_TYPE),
    ONLINE_MARKETING_TYPE: JSON.stringify(parsedInput.ONLINE_MARKETING_TYPE),
    BUSINESS_FUTURE_PLAN: JSON.stringify(parsedInput.BUSINESS_FUTURE_PLAN),
    SEEK_FINANCING_METHOD: parsedInput.SEEK_FINANCING_METHOD
      ? JSON.stringify(parsedInput.SEEK_FINANCING_METHOD)
      : '',
    CUSTOMER_PAYMENT_METHODS: JSON.stringify(parsedInput.CUSTOMER_PAYMENT_METHODS),
    FULLTIME_EMPLOYEE_COUNT: parsedInput.EMPLOYEE_COUNT_DETAIL.FULLTIME,
    PARTTIME_EMPLOYEE_COUNT: parsedInput.EMPLOYEE_COUNT_DETAIL.PARTTIME,
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
    oneQuestionnaire: async (parent, { COMPANY_ID }, { connectors: { MysqlSlvQuestionnaire } }) => {
      const searchOpts = { where: { COMPANY_ID } };
      const res = await MysqlSlvQuestionnaire.findOne(searchOpts);
      const result = res.dataValues;

      // process result
      const processedResult = {
        AVAILABLE_SYSTEM: JSON.parse(result.AVAILABLE_SYSTEM),
        MARKETING_TYPE: JSON.parse(result.MARKETING_TYPE),
        ONLINE_MARKETING_TYPE: JSON.parse(result.ONLINE_MARKETING_TYPE),
        BUSINESS_FUTURE_PLAN: JSON.parse(result.BUSINESS_FUTURE_PLAN),
        SEEK_FINANCING_METHOD: result.SEEK_FINANCING_METHOD
          ? JSON.parse(result.SEEK_FINANCING_METHOD)
          : '',
        CUSTOMER_PAYMENT_METHODS: JSON.parse(result.CUSTOMER_PAYMENT_METHODS),
        EMPLOYEE_COUNT_DETAIL: {
          FULLTIME: result.FULLTIME_EMPLOYEE_COUNT,
          PARTTIME: result.PARTTIME_EMPLOYEE_COUNT,
        },
      };
      const newResult = {
        ...result,
        ...processedResult,
      };

      return newResult;
    },
  },
  Mutation: {
    createQuestionnaire:
      async (parent, { input }, { connectors: { MysqlSlvQuestionnaire } }) => {
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
        return MysqlSlvQuestionnaire.create(newInput);
      },
    updateQuestionnaire:
      async (parent, { input }, { connectors: { MysqlSlvQuestionnaire } }) => {
        const postInput = processInput(input);
        const history = generateHistory(input.name, 'UPDATE');
        const searchOpts = {
          object: {
            ...postInput,
            ...history,
          },
          where: {
            COMPANY_ID: input.COMPANY_ID,
          },
        };
        const result = await MysqlSlvQuestionnaire.update(searchOpts);
        const result2 = {
          ID: input.COMPANY_ID,
          updated: result[0],
        };
          // console.dir(result2, { depth: null, colorized: true });
        return result2;
      },
  },
};
