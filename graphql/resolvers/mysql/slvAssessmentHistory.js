const { processSurveyResult, getDifference, cleanEmpty } = require('../../helper/common');

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allAssessmentHistory: async (
      parent,
      { COMPANY_ID },
      { connectors: { MysqlSlvAssessment, MysqlSlvAssessmentHistory } }) => {
      const searchOpts = {
        where: { COMPANY_ID },
        order: [['CREATED_AT', 'DESC']],
      };
      // current
      const resQuest = await MysqlSlvAssessment.findOne(searchOpts);
      const result = resQuest.dataValues;
      const resultParsed = processSurveyResult(result);

      // history
      const resultHist = await MysqlSlvAssessmentHistory.findAll(searchOpts);
      // console.log(result);

      // process result
      const processedResult = resultHist.map((x) => {
        const res = x.dataValues;
        // console.log(res);

        // history
        const history = getDifference(result, res);
        const parseDataHist = processSurveyResult(history);
        const newObjHist = Object.assign({}, parseDataHist);

        // delete newObjHist.EMPLOYEE_DETAILS;
        const emptyStuffHist = cleanEmpty(newObjHist);

        // console.log(history);
        // console.log(parseDataHist);

        // combine all
        return {
          ...history,
          ...emptyStuffHist,
          CREATED_BY: res.CREATED_BY,
        };
      });

      const finalResult = {
        current: {
          ...result,
          ...resultParsed,
        },
        history: processedResult,
      };

      return finalResult;
    },
  },
};
