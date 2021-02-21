const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { processSurveyResult } = require('../../helper/common');

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allAssessment: async (
      parent,
      { COMPANY_ID },
      { connectors: { MysqlSlvSurvey, MysqlSlvAssessment } },
    ) => {
      let resultQuest = [];
      let resultScore = [];

      const searchOpts = { where: { COMPANY_ID } };

      // survey
      const resQuest = await MysqlSlvSurvey.findAll(searchOpts);
      if (resQuest.length !== 0) {
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
      if (resScore.length !== 0)resultScore = resScore.map(asmt => asmt.dataValues);

      const result = {
        assessment: resultScore,
        survey: resultQuest,
      };

      return result;
    },
  },
  Mutation: {
    createAssessment: async (
      parent, { input }, { connectors: { MysqlSlvAssessment } }) => {
      // process input
      const parsedInput = JSON.parse(input.data);

      const history = generateHistory(input.name, 'CREATE');
      const newInput = {
        ...parsedInput,
        ID: generateId(),
        ...history,
        COMPANY_ID: input.COMPANY_ID,
        ASSESSMENT_YEAR: 1000,
      };
        // console.log(newInput);
      const result = await MysqlSlvAssessment.create(newInput);
      return result;
    },
    updateAssessment: async (
      parent, { input }, { connectors: { MysqlSlvAssessment } }) => {
      const parsedInput = JSON.parse(input.data);

      // store new entry
      const history = generateHistory(input.name, 'UPDATE', parsedInput.CREATED_AT);
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
      const result = await MysqlSlvAssessment.update(searchOpts);
      const result2 = {
        ID: input.COMPANY_ID,
        updated: result[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    },
  },
};
