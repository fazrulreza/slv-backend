const { generateId, generateHistory } = require('../../../packages/mysql-model');
const {
  processSurveyResult, calculateScores, classScore, profileGroup,
} = require('../../helper/common');


// calculate total score
const getTotalScore = (scorecard) => {
  const sumScore = scorecard
    .reduce(((acc, v) => (v.FINAL_SCORE === 'N/A' ? acc : acc + parseFloat(v.FINAL_SCORE))), 0);
  const countScore = scorecard
    .reduce(((acc, v) => (v.FINAL_SCORE === 'N/A' ? acc : acc + 1)), 0);
  return (Math.round((sumScore / countScore) * 10) / 10);
};

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    fullElsaList: async (
      parent,
      { user, userType },
      { connectors: { MysqlSlvCompanyProfile, MysqlSlvELSAScorecard } }) => {
      let result = [];
      let resultCompany = [];
      let where = { CREATED_BY: user };

      // check admin
      if (userType === 'ADMIN') where = null;
      const searchOpts = { where };
      const searchOptsAll = { where: null };

      // company
      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      resultCompany = resCompany.length !== 0 && resCompany.map(x => x.dataValues.ID);

      // Elsa
      const resElsa = await MysqlSlvELSAScorecard.findAll(searchOptsAll);
      const resultElsa = resElsa
        .map(j => j.dataValues)
        .filter(oa => oa.ASSESSMENT_YEAR === 1000);

      if (resultCompany.length !== 0) {
        const scoreArray = resultCompany.map((cm) => {
          const scorecard = resultElsa.filter(cmp => cmp.COMPANY_ID === cm);
          if (scorecard.length === 0) return 0;
          // calculate total score
          const finalScore = getTotalScore(scorecard);
          return Math.floor(finalScore);
        });

        const noZeroScoreArray = scoreArray.filter(m => m !== 0);

        if (noZeroScoreArray.length !== 0) {
          result = Object.keys(profileGroup)
            .map(k => ({
              stage: k,
              count: noZeroScoreArray.filter(m => m === (parseInt(k, 10))).length,
            }));
        }
      }

      return result;
    },
    /**
         * Retrieve all company, survey, assessment by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneAll: async (
      parent,
      { input },
      {
        connectors:
        {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment,
          MysqlSlvMSIC, MysqlSlvELSAScorecard,
        },
      },
    ) => {
      // company
      const searchOpts = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resultCompany = await MysqlSlvCompanyProfile.findById(input.COMPANY_ID);

      // MSIC
      const searchOpts2 = { where: { MSIC: resultCompany.MSIC } };
      const resMSIC = await MysqlSlvMSIC.findOne(searchOpts2);
      const resultMSIC = resMSIC.dataValues;

      // get all unique assessment year
      const resElsaScoreAll = await MysqlSlvELSAScorecard.findAll(searchOpts);
      const yearOnly = resElsaScoreAll.length !== 0
        ? resElsaScoreAll.map(e => e.dataValues.ASSESSMENT_YEAR)
        : [input.ASSESSMENT_YEAR];
      const yearList = yearOnly.filter((item, index) => yearOnly.indexOf(item) === index);

      const finalResult = await Promise.all(yearList.map(async (yr) => {
        let resultQuest = null;
        let resultScore = null;
        let scorecard = [];
        let totalFinalScore = 0;

        if (yr !== 1000) {
          const searchOptsElsaAll = {
            where: {
              COMPANY_ID: input.COMPANY_ID,
              ASSESSMENT_YEAR: yr,
            },
          };
          // survey
          const resQuest = await MysqlSlvSurvey.findOne(searchOptsElsaAll);
          resultQuest = resQuest.dataValues;
          // process result
          const processedResult = processSurveyResult(resultQuest);

          resultQuest = {
            ...resultQuest,
            ...processedResult,
          };

          // assessment
          const resScore = await MysqlSlvAssessment.findOne(searchOptsElsaAll);
          resultScore = resScore.dataValues;

          // ELSA
          const resElsaScore = await MysqlSlvELSAScorecard.findAll(searchOptsElsaAll);
          scorecard = resElsaScore.map((d) => {
            const newScore = d.dataValues;
            return {
              ...newScore,
              FINAL_SCORE: parseFloat(newScore.FINAL_SCORE),
              FINAL_SCORE_ROUNDDOWN: parseFloat(newScore.FINAL_SCORE_ROUNDDOWN),
              NEXT_DESIRED_SCORE: parseFloat(newScore.NEXT_DESIRED_SCORE),
            };
          });
        } else {
          const searchOpts1000 = {
            where: {
              COMPANY_ID: input.COMPANY_ID,
              ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
            },
          };
          // survey
          const resQuest = await MysqlSlvSurvey.findOne(searchOpts1000);
          resultQuest = resQuest ? resQuest.dataValues : null;

          if (resultQuest) {
            // process result
            const processedResult = processSurveyResult(resultQuest);

            resultQuest = {
              ...resultQuest,
              ...processedResult,
            };

            // assessment
            const resScore = await MysqlSlvAssessment.findOne(searchOpts1000);
            resultScore = resScore ? resScore.dataValues : null;

            if (resultScore) {
              // calculate score
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

              // store in DB
              const dbStoreScoreCard = scorecard.map((b) => {
                const history = generateHistory(input.user, 'CREATE');
                const newB = {
                  ...b,
                  ...history,
                  ID: generateId(),
                  ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
                  COMPANY_ID: input.COMPANY_ID,
                };
                return newB;
              });

              // remove and recreate with new value
              const searchOptsElsa = {
                where: {
                  COMPANY_ID: input.COMPANY_ID,
                  ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
                },
              };
              const resElsaScore = await MysqlSlvELSAScorecard.findAll(searchOptsElsa);
              if (resElsaScore && resElsaScore.length !== 0) {
                await MysqlSlvELSAScorecard.delete(searchOptsElsa);
              }
              await MysqlSlvELSAScorecard.bulkCreate(dbStoreScoreCard);
            }
          }
        }

        // calculate total score
        totalFinalScore = getTotalScore(scorecard);

        const result = {
          company: resultCompany.dataValues,
          assessment: resultScore,
          survey: resultQuest,
          msicDetails: resultMSIC,
          ELSA: scorecard,
          TOTAL_FINAL_SCORE: totalFinalScore,
          ASSESSMENT_YEAR: yr,
        };

        return result;
      }));

      return finalResult;
    },
  },
  Mutation: {
    createElsa: async (
      parent, { input }, {
        connectors: {
          MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvELSAScorecard,
        },
      },
    ) => {
      // survey
      const searchOptsSurvey = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resSurvey = await MysqlSlvSurvey.findOne(searchOptsSurvey);
      const surveyInput = resSurvey.dataValues;
      const surveyHist = generateHistory(input.name, 'CREATE');
      const finalSurvey = {
        ...surveyInput,
        ...surveyHist,
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        ID: generateId(),
      };
      await MysqlSlvSurvey.create(finalSurvey);

      // assessment
      const searchOptsAssess = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resAssess = await MysqlSlvAssessment.findOne(searchOptsAssess);
      const assessInput = resAssess.dataValues;
      const assessHist = generateHistory(input.name, 'CREATE');
      const finalAssess = {
        ...assessInput,
        ...assessHist,
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        ID: generateId(),
      };
      await MysqlSlvAssessment.create(finalAssess);

      // scorecard
      const searchOptsElsa = {
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
        },
      };
      const resElsa = await MysqlSlvELSAScorecard.findAll(searchOptsElsa);
      const elsaInput = resElsa.map((b) => {
        const preB = b.dataValues;
        const history = generateHistory(input.name, 'CREATE');
        const newB = {
          ...preB,
          ...history,
          ID: generateId(),
          ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
          COMPANY_ID: input.COMPANY_ID,
        };
        return newB;
      });
      await MysqlSlvELSAScorecard.bulkCreate(elsaInput);

      return input;
    },
  },
};
