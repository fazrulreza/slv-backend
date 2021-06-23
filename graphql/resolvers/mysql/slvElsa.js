const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { processSurveyResult, calculateScores, getTotalScore } = require('../../helper/common');
const { classScore, profileGroup } = require('../../helper/parameter');
const { allSLVResolver, elsaResolver, assessmentElsaResolver } = require('../../permissions/acl');

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    fullElsaList: allSLVResolver.createResolver(async (
      parent, param,
      {
        connectors: { MysqlSlvCompanyProfile, MysqlSlvELSAScorecard, MysqlSlvSurvey },
        user: { mail, userType },
      },
    ) => {
      let result = [];
      let resultCompany = [];
      let resultQuest = [];
      let resultElsa = [];
      let where = { CREATED_BY: mail };

      // check admin
      if (userType === 'ADMIN') where = null;
      const searchOpts = { where };
      const searchOptsAll = { where: null };

      // company
      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      if (resCompany.length !== 0) resultCompany = resCompany.map((x) => x.dataValues.ID);

      // survey
      const resQuest = await MysqlSlvSurvey.findAll(searchOpts);
      if (resQuest.length !== 0) {
        resultQuest = resQuest
          .map((s) => s.dataValues)
          .filter((oa) => oa.ASSESSMENT_YEAR === 1000)
          .filter((cls) => cls.SME_CLASS !== 'LARGE ENTERPRISE' && cls.SME_CLASS !== 'N/A')
          .map((sv) => sv.COMPANY_ID);
      }

      // ELSA
      const resElsa = await MysqlSlvELSAScorecard.findAll(searchOptsAll);
      if (resElsa.length !== 0) {
        resultElsa = resElsa
          .map((j) => j.dataValues)
          .filter((oa) => oa.ASSESSMENT_YEAR === 1000);
      }

      if (resultCompany.length !== 0 && resultQuest.length !== 0 && resultElsa.length !== 0) {
        const scoreArray = resultCompany
          .map((cm) => {
            const scorecard = resultElsa.filter((cmp) => cmp.COMPANY_ID === cm);
            if (scorecard.length === 0) return 0;
            if (!resultQuest.includes(cm)) return 0;
            // calculate total score
            const finalScore = getTotalScore(scorecard);
            return Math.floor(finalScore);
          });

        const noZeroScoreArray = scoreArray.filter((m) => m !== 0);

        if (noZeroScoreArray.length !== 0) {
          result = Object.keys(profileGroup)
            .map((k) => ({
              stage: k,
              count: noZeroScoreArray.filter((m) => m === (parseInt(k, 10))).length,
            }));
        }
      }

      return result;
    }),
    oneElsa: assessmentElsaResolver.createResolver(async (
      parent, { input }, { connectors: { MysqlSlvAssessment, MysqlSlvELSAScorecard } },
    ) => {
      const searchOpts = {
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        },
      };

      const resScore = await MysqlSlvAssessment.findAll(searchOpts);
      const resultScore = resScore.length !== 0 ? resScore.map((a) => a.dataValues) : resScore;

      const resElsa = await MysqlSlvELSAScorecard.findAll(searchOpts);
      const resultElsa = resElsa.length !== 0 ? resElsa.map((a) => a.dataValues) : resElsa;

      // calculate total score
      const totalFinalScore = getTotalScore(resultElsa);

      const result = {
        assessment: resultScore[0],
        ELSA: resultElsa,
        TOTAL_FINAL_SCORE: totalFinalScore,
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
      };

      return result;
    }),
    /**
         * Retrieve all company, survey, assessment by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneAll: allSLVResolver.createResolver(async (
      parent, { input },
      {
        connectors:
        {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment,
          MysqlSlvMSIC, MysqlSlvELSAScorecard,
        },
        user,
      },
    ) => {
      // company
      const searchOpts = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resultCompany = await MysqlSlvCompanyProfile.findById(input.COMPANY_ID);

      // no company, return null
      if (!resultCompany) {
        return [{
          company: null,
          assessment: null,
          survey: null,
          msicDetails: null,
          ELSA: null,
          TOTAL_FINAL_SCORE: null,
          ASSESSMENT_YEAR: null,
        }];
      }

      // survey
      const resQuestPre = await MysqlSlvSurvey.findAll(searchOpts);
      const resQuest = resQuestPre.length !== 0
        ? resQuestPre.map((s) => s.dataValues)
        : resQuestPre;

      // assessment
      const resScorePre = await MysqlSlvAssessment.findAll(searchOpts);
      const resScore = resScorePre.length !== 0
        ? resScorePre.map((a) => a.dataValues)
        : resScorePre;

      // ELSA
      const resElsaPre = await MysqlSlvELSAScorecard.findAll(searchOpts);
      const resElsa = resElsaPre.length !== 0 ? resElsaPre.map((a) => a.dataValues) : resElsaPre;

      // MSIC
      const searchOpts2 = { where: { MSIC: resultCompany.MSIC } };
      const resMSIC = await MysqlSlvMSIC.findOne(searchOpts2);
      const resultMSIC = resMSIC ? resMSIC.dataValues : null;

      // get all unique assessment year
      const resElsaScoreAll = await MysqlSlvELSAScorecard.findAll(searchOpts);
      const yearOnly = resElsaScoreAll.length !== 0
        ? resElsaScoreAll.map((e) => e.dataValues.ASSESSMENT_YEAR)
        : [input.ASSESSMENT_YEAR];
      const uniqueYear = yearOnly.filter((item, index) => yearOnly.indexOf(item) === index);
      const yearList = uniqueYear.includes(1000) ? uniqueYear : [...uniqueYear, 1000];

      const finalResult = yearList.map((yr) => {
        let resultQuest = null;
        let resultScore = null;
        let scorecard = [];
        let totalFinalScore = 0;

        if (yr === 1000) {
          // survey
          const resultQuestPre = resQuest.filter((v) => v.ASSESSMENT_YEAR === 1000);
          resultQuest = resultQuestPre.length !== 0 ? resultQuestPre[0] : null;

          if (resultQuest) {
            // process result
            const processedResult = processSurveyResult(resultQuest);

            resultQuest = {
              ...resultQuest,
              ...processedResult,
            };

            // assessment
            const resultScorePre = resScore.filter((w) => w.ASSESSMENT_YEAR === 1000);
            resultScore = resultScorePre.length !== 0 ? resultScorePre[0] : null;

            if (resultScore && resultQuest.SME_CLASS !== 'LARGE ENTERPRISE' && resultQuest.SME_CLASS !== 'N/A') {
              // calculate score
              const getClassScore = Object.keys(resultScore)
                .map((y) => {
                  const getUnitClassScore = (Number.isInteger(resultScore[y]) && classScore[y])
                    ? classScore[y][resultQuest.SME_CLASS]
                    : null;
                  const weightedScore = Number.isInteger(getUnitClassScore)
                    ? resultScore[y] * getUnitClassScore
                    : 'N/A';
                  const resClassScore = {
                    [y]: resultScore[y],
                    unitClassScore: getUnitClassScore,
                    weightedScore,
                  };
                  return resClassScore;
                })
                .filter((z) => classScore[Object.keys(z)[0]]);

              // console.log(getClassScore);

              // get big class Score
              const BR_GROUP = calculateScores(getClassScore, 'BR_', yr);
              const LC_GROUP = calculateScores(getClassScore, 'LC_', yr);
              const PR_GROUP = calculateScores(getClassScore, 'PR_', yr);
              const SR_GROUP = calculateScores(getClassScore, 'SR_', yr);
              const FR_GROUP = calculateScores(getClassScore, 'FR_', yr);

              scorecard = [
                BR_GROUP,
                LC_GROUP,
                PR_GROUP,
                SR_GROUP,
                FR_GROUP,
              ];
            }
          }
        } else {
          // survey
          [resultQuest] = resQuest.filter((x) => x.ASSESSMENT_YEAR === yr);
          if (!resultQuest) {
            return {
              company: null,
              assessment: null,
              survey: null,
              msicDetails: null,
              ELSA: null,
              TOTAL_FINAL_SCORE: null,
              ASSESSMENT_YEAR: null,
            };
          }
          // process result
          const processedResult = processSurveyResult(resultQuest);
          resultQuest = {
            ...resultQuest,
            ...processedResult,
          };

          // assessment
          [resultScore] = resScore.filter((y) => y.ASSESSMENT_YEAR === yr);

          // ELSA
          const resultElsa = resElsa.filter((e) => e.ASSESSMENT_YEAR === yr);
          scorecard = resultElsa.map((d) => ({
            ...d,
            FINAL_SCORE: parseFloat(d.FINAL_SCORE),
            FINAL_SCORE_ROUNDDOWN: parseFloat(d.FINAL_SCORE_ROUNDDOWN),
            NEXT_DESIRED_SCORE: parseFloat(d.NEXT_DESIRED_SCORE),
          }));
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
      });

      // store in DB if default 1000
      if (input.ASSESSMENT_YEAR === 1000) {
        // get elsa
        const [toStore] = finalResult
          .filter((i) => i.ASSESSMENT_YEAR === 1000)
          .map((j) => j.ELSA);

        // generate history
        const dbStoreScoreCard = toStore.map((b) => {
          const history = generateHistory(user.mail, 'CREATE');
          const newB = {
            ...b,
            ...history,
            ID: generateId(),
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

      return finalResult;
    }),
  },
  Mutation: {
    createElsa: elsaResolver.createResolver(async (
      parent, { input }, {
        connectors: {
          MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvELSAScorecard,
        },
        user,
      },
    ) => {
      // survey
      const searchOptsSurvey = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resSurvey = await MysqlSlvSurvey.findOne(searchOptsSurvey);
      const surveyInput = resSurvey.dataValues;
      const surveyHist = generateHistory(user.mail, 'CREATE');
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
      const assessHist = generateHistory(user.mail, 'CREATE');
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
        const history = generateHistory(user.mail, 'CREATE');
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
    }),
  },
};
