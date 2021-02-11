const { processSurveyResult, getDifference, cleanEmpty } = require('../../helper/common');

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allSurveyHistory: async (
      parent,
      { COMPANY_ID },
      { connectors: { MysqlSlvSurvey, MysqlSlvSurveyHistory } }) => {
      const searchOpts = {
        where: { COMPANY_ID },
        order: [['CREATED_AT', 'DESC']],
      };
      // current
      const resQuest = await MysqlSlvSurvey.findOne(searchOpts);
      const result = resQuest.dataValues;
      const resultParsed = processSurveyResult(result);

      // history
      const resultHist = await MysqlSlvSurveyHistory.findAll(searchOpts);
      // console.log(result);

      // process result
      const processedResult = resultHist.map((x) => {
        const res = x.dataValues;
        // console.log(res);

        // history
        const history = getDifference(result, res);
        const parseDataHist = processSurveyResult(history);
        const newObjHist = Object.assign({}, parseDataHist);

        // cleanup data
        if (history.FULLTIME_EMPLOYEE_COUNT
          || history.FULLTIME_EMPLOYEE_COUNT === 0
          || history.PARTTIME_EMPLOYEE_COUNT
          || history.PARTTIME_EMPLOYEE_COUNT === 0) {
          newObjHist.EMPLOYEE_COUNT_DETAIL = {
            FULLTIME: res.FULLTIME_EMPLOYEE_COUNT,
            PARTTIME: res.PARTTIME_EMPLOYEE_COUNT,
          };
        } else {
          delete newObjHist.EMPLOYEE_COUNT_DETAIL;
        }

        delete newObjHist.EMPLOYEE_DETAILS;
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
