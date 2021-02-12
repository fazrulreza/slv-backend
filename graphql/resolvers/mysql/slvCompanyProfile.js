const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { processSurveyResult, calculateScores, classScore } = require('../../helper/common');

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneCompany: async (
      parent,
      { ID }, { connectors: { MysqlSlvCompanyProfile, MysqlSlvMSIC } },
    ) => {
      const searchOpts = {
        where: null,
        order: [['MSIC']],
      };
      const result = await MysqlSlvMSIC.findAll(searchOpts);
      const result2 = result.map(x => x.dataValues);

      const res = await MysqlSlvCompanyProfile.findById(ID);
      if (!res) {
        throw new Error(`No record found with id ${ID}`);
      }
      const finalResult = {
        allMSIC: result2,
        company: res,
      };
      return finalResult;
    },
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.msic msic
         */
    allCompanies: async (
      parent,
      { user, userType },
      { connectors: { MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment } },
    ) => {
      let where = { CREATED_BY: user };

      // check admin
      if (userType === 'ADMIN') {
        where = null;
      }

      const searchOpts = {
        where,
        order: [['ENTITY_NAME']],
      };
      const result = await MysqlSlvCompanyProfile.findAll(searchOpts);
      const result2 = result.map(x => x.dataValues);

      // survey + assessment
      const searchOpts2 = { where: null };
      const resultQuest = await MysqlSlvSurvey.findAll(searchOpts2);
      const resultScore = await MysqlSlvAssessment.findAll(searchOpts2);
      const result3 = result2.map((x) => {
        const resQ = resultQuest.filter(y => y.dataValues.COMPANY_ID === x.ID);
        const resS = resultScore.filter(z => z.dataValues.COMPANY_ID === x.ID);
        const SURVEY_DONE = resQ.length !== 0;
        const ASSESSMENT_DONE = resS.length !== 0;
        return {
          ...x,
          SURVEY_DONE,
          ASSESSMENT_DONE,
        };
      });
      // console.dir(resultQuest, { depth: null, colorized: true });
      return result3;
    },
    /**
         * Retrieve all company, survey, assessment by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneAll: async (
      parent,
      { COMPANY_ID },
      {
        connectors:
        {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvMSIC,
        },
      },
    ) => {
      let resultQuest = null;
      let resultScore = null;
      let scorecard = [];
      let totalFinalScore = 0;

      const searchOpts = { where: { COMPANY_ID } };

      // company
      const resultCompany = await MysqlSlvCompanyProfile.findById(COMPANY_ID);

      // MSIC
      const searchOpts2 = { where: { MSIC: resultCompany.MSIC } };
      const resMSIC = await MysqlSlvMSIC.findOne(searchOpts2);
      const resultMSIC = resMSIC.dataValues;


      // survey
      const resQuest = await MysqlSlvSurvey.findOne(searchOpts);
      resultQuest = resQuest ? resQuest.dataValues : null;

      if (resultQuest) {
        // process result
        const processedResult = processSurveyResult(resultQuest);

        resultQuest = {
          ...resultQuest,
          ...processedResult,
        };

        // assessment
        const resScore = await MysqlSlvAssessment.findOne(searchOpts);
        resultScore = resScore ? resScore.dataValues : null;
        if (resultScore) {
          const getClassScore = Object.keys(resultScore)
            .map((y) => {
              const getUnitClassScore = (Number.isInteger(resultScore[y]) && classScore[y])
                ? classScore[y][resultQuest.SME_CLASS]
                : null;
              const weightedScore = Number.isInteger(getUnitClassScore) ? resultScore[y] * getUnitClassScore : 'N/A';
              const resClassScore = {
                [y]: resultScore[y],
                unitClassScore: getUnitClassScore,
                weightedScore,
              };
              return resClassScore;
            })
            .filter(z => classScore[Object.keys(z)[0]]);

          // console.log(getClassScore);

          // get big class Score
          const BR_GROUP = calculateScores(getClassScore, 'BR_');
          const LC_GROUP = calculateScores(getClassScore, 'LC_');
          const PR_GROUP = calculateScores(getClassScore, 'PR_');
          const SR_GROUP = calculateScores(getClassScore, 'SR_');
          const FR_GROUP = calculateScores(getClassScore, 'FR_');

          scorecard = [
            BR_GROUP,
            LC_GROUP,
            PR_GROUP,
            SR_GROUP,
            FR_GROUP,
          ];

          const sumScore = scorecard.reduce(((acc, v) => (v.FINAL_SCORE === 'N/A' ? acc : acc + v.FINAL_SCORE)), 0);
          const countScore = scorecard.reduce(((acc, v) => (v.FINAL_SCORE === 'N/A' ? acc : acc + 1)), 0);
          totalFinalScore = (Math.round((sumScore / countScore) * 10) / 10);
          // console.log(sumScore);
          // console.log(countScore);
          // console.log(totalFinalScore);
        }
      }

      const result = {
        company: resultCompany,
        assessment: resultScore,
        survey: resultQuest,
        msicDetails: resultMSIC,
        ELSA: scorecard,
        TOTAL_FINAL_SCORE: totalFinalScore,
      };

      return result;
    },
  },
  Mutation: {
    createCompany: async (
      parent, { input }, { connectors: { MysqlSlvCompanyProfile } },
    ) => {
      const parsedInput = JSON.parse(input.data);
      const history = generateHistory(input.name, 'CREATE');
      const newInput = {
        ...parsedInput,
        ID: generateId(),
        ...history,
      };
        //   console.log(newInput);
      return MysqlSlvCompanyProfile.create(newInput);
    },
    deleteCompany: async (
      parent,
      { ID },
      { connectors: { MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment } },
    ) => {
      // remove company
      const searchOpts = {
        where: { ID },
      };
      const result = await MysqlSlvCompanyProfile.delete(searchOpts);

      // remove company from other tables
      const searchOpts2 = {
        where: { COMPANY_ID: ID },
      };
      await MysqlSlvSurvey.delete(searchOpts2);
      await MysqlSlvAssessment.delete(searchOpts2);

      const result2 = {
        ID,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    },
    updateCompany: async (
      parent,
      { ID, input },
      { connectors: { MysqlSlvCompanyProfile } },
    ) => {
      const parsedInput = JSON.parse(input.data);
      const history = generateHistory(input.name, 'UPDATE', parsedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...parsedInput,
          ...history,
        },
        where: {
          ID,
        },
      };
      const result = await MysqlSlvCompanyProfile.update(searchOpts);
      const result2 = {
        ID,
        updated: result[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    },
  },
};
