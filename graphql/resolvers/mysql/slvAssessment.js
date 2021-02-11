const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { processSurveyResult } = require('../../helper/common');

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneAssessment: async (
      parent,
      { COMPANY_ID },
      { connectors: { MysqlSlvSurvey, MysqlSlvAssessment } },
    ) => {
      const searchOpts = { where: { COMPANY_ID } };

      // assessment
      const resScore = await MysqlSlvAssessment.findOne(searchOpts);
      const resultScore = resScore ? resScore.dataValues : null;
      // survey
      const resQuest = await MysqlSlvSurvey.findOne(searchOpts);
      let resultQuest = resQuest ? resQuest.dataValues : null;

      if (resultQuest) {
        // process result
        const processedResult = processSurveyResult(resultQuest);

        resultQuest = {
          ...resultQuest,
          ...processedResult,
        };
      }

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
      };
        // console.log(newInput);
      const result = await MysqlSlvAssessment.create(newInput);
      return result;
    },
    updateAssessment: async (
      parent, { input }, { connectors: { MysqlSlvAssessment, MysqlSlvAssessmentHistory } }) => {
      const parsedInput = JSON.parse(input.data);

      // store previous entry
      const searchOptsHist = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resHist = await MysqlSlvAssessment.findOne(searchOptsHist);
      const histInput = resHist.dataValues;
      const historyHist = generateHistory(input.name, 'CREATE', histInput.CREATED_AT);
      const finalHist = {
        ...histInput,
        ...historyHist,
        ID: generateId(),
      };
      await MysqlSlvAssessmentHistory.create(finalHist);

      // store new entry
      const history = generateHistory(input.name, 'UPDATE', parsedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...parsedInput,
          ...history,
        },
        where: {
          COMPANY_ID: input.COMPANY_ID,
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
