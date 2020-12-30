const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { processQuestionnaireResult } = require('../../helper/common');

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneScoring: async (parent,
      { COMPANY_ID },
      { connectors: { MysqlSlvScoring, MysqlSlvQuestionnaire } }) => {
      const searchOpts = { where: { COMPANY_ID } };

      // scoring
      const resScore = await MysqlSlvScoring.findOne(searchOpts);
      const resultScore = resScore ? resScore.dataValues : null;
      // questionnaire
      const resQuest = await MysqlSlvQuestionnaire.findOne(searchOpts);
      let resultQuest = resQuest ? resQuest.dataValues : null;

      if (resultQuest) {
        // process result
        const processedResult = processQuestionnaireResult(resultQuest);

        resultQuest = {
          ...resultQuest,
          ...processedResult,
        };
      }

      const result = {
        scoring: resultScore,
        questionnaire: resultQuest,
      };

      return result;
    },
  },
  Mutation: {
    createScoring:
      async (parent, { input }, { connectors: { MysqlSlvScoring } }) => {
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
        const result = await MysqlSlvScoring.create(newInput);
        return result;
      },
    updateScoring:
      async (parent, { input }, { connectors: { MysqlSlvScoring } }) => {
        const parsedInput = JSON.parse(input.data);
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
        const result = await MysqlSlvScoring.update(searchOpts);
        const result2 = {
          ID: input.COMPANY_ID,
          updated: result[0],
        };
          // console.dir(result2, { depth: null, colorized: true });
        return result2;
      },
  },
};
