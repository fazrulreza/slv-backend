const { generateId, generateHistory } = require('../../../packages/mysql-model');
const {
  processSurveyResult, calculateScores, getTotalScore, checkPermission,
} = require('../../helper/common');
const { classScore, profileGroup } = require('../../helper/parameter');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');

const getPrediction = (resultPredict, fields, factor) => {
  // prepare key
  const keySearchPre = fields.reduce((fullT, t) => `${fullT}${t}`, '');
  const keySearch = keySearchPre.replace(/\s+/g, '').toUpperCase();

  // filter key
  const keyDataPre = resultPredict
    .filter((x) => x.FACTOR === factor && x.KEY === keySearch);
  const keyData = keyDataPre.length !== 0 ? keyDataPre[0].VALUE : 1;
  return keyData;
};

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    fullElsaList: isAuthenticatedResolver.createResolver(async (
      parent, param,
      {
        connectors: { FileSlvCompanyProfile, FileSlvELSAScorecard, FileSlvSurvey },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('ELSA-READ', userRoleList)) throw new ForbiddenError();

      let result = [];
      let resultCompany = [];
      let resultQuest = [];
      let resultElsa = [];
      let where = { CREATED_BY: mail };

      // check module admin
      if (userRoleList.DATA_VIEW === 'MODULE') {
        where = { MODULE: userRoleList.MODULE };
      }
      // check admin
      if (userRoleList.MODULE === 'ALL') {
        where = null;
      }

      const searchOpts = { where };
      const searchOptsAll = { where: null };

      // company
      const resCompany = await FileSlvCompanyProfile.findAll(searchOpts);
      if (resCompany.length !== 0) resultCompany = resCompany.map((x) => x.ID);

      // survey
      const resQuest = await FileSlvSurvey.findAll(searchOpts);
      if (resQuest.length !== 0) {
        resultQuest = resQuest
          .filter((oa) => oa.ASSESSMENT_YEAR === 1000)
          .filter((cls) => cls.SME_CLASS !== 'LARGE ENTERPRISE' && cls.SME_CLASS !== 'N/A')
          .map((sv) => sv.COMPANY_ID);
      }

      // ELSA
      const resElsa = await FileSlvELSAScorecard.findAll(searchOptsAll);
      if (resElsa.length !== 0) {
        resultElsa = resElsa
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
    oneElsa: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { FileSlvAssessment, FileSlvELSAScorecard },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('ELSA-READ', userRoleList)) throw new ForbiddenError();

      const searchOpts = {
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        },
      };

      const resScore = await FileSlvAssessment.findAll(searchOpts);
      const resultScore = resScore.length !== 0 ? resScore : resScore;

      const resElsa = await FileSlvELSAScorecard.findAll(searchOpts);
      const resultElsa = resElsa.length !== 0 ? resElsa : resElsa;

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
    oneAll: isAuthenticatedResolver.createResolver(async (
      parent, { input },
      {
        connectors:
        {
          FileSlvCompanyProfile, FileSlvSurvey, FileSlvAssessment,
          FileSlvMSIC, FileSlvELSAScorecard, FileSlvPrediction,
        },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('ELSA-READ', userRoleList)) throw new ForbiddenError();

      // company
      const searchOpts = { where: { COMPANY_ID: input.COMPANY_ID } };
      const searchOptsAll = { where: null };

      const resultCompany = await FileSlvCompanyProfile.findById(input.COMPANY_ID);

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
      const resQuestPre = await FileSlvSurvey.findAll(searchOpts);
      const resQuest = resQuestPre.length !== 0
        ? resQuestPre
        : resQuestPre;

      // assessment
      const resScorePre = await FileSlvAssessment.findAll(searchOpts);
      const resScore = resScorePre.length !== 0
        ? resScorePre
        : resScorePre;

      // ELSA
      const resElsaPre = await FileSlvELSAScorecard.findAll(searchOpts);
      const resElsa = resElsaPre.length !== 0 ? resElsaPre : resElsaPre;

      // MSIC
      const searchOpts2 = { where: { MSIC: resultCompany.MSIC } };
      const resMSIC = await FileSlvMSIC.findOne(searchOpts2);
      const resultMSIC = resMSIC || null;

      // prediction
      const resultPredict = await FileSlvPrediction.findAll(searchOptsAll);

      // get all unique assessment year
      const resElsaScoreAll = await FileSlvELSAScorecard.findAll(searchOpts);
      const yearOnly = resElsaScoreAll.length !== 0
        ? resElsaScoreAll.map((e) => e.ASSESSMENT_YEAR)
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

            // intercept public here
            if (input.PUBLIC) {
              const IG_INDUSTRY_POTENTIAL = getPrediction(
                resultPredict, [
                  resultQuest.YEARLY_BUSINESS_PERFORMANCE,
                  resultQuest.YEARLY_INDUSTRY_PERFORMANCE,
                ],
                'IG_INDUSTRY_POTENTIAL',
              );

              const BR_PRODUCT_LINE = getPrediction(
                resultPredict, [
                  resultQuest.PRODUCT_COUNT,
                  resultQuest.PRODUCT_PERFORMANCE_2YEARS,
                  resultQuest.PRODUCT_MARKET_LOCATION,
                ],
                'BR_PRODUCT_LINE',
              );

              const BR_PRODUCT_QUALITY = getPrediction(
                resultPredict, [
                  resultQuest.PRODUCT_FEEDBACK_COLLECTION_FLAG,
                ],
                'BR_PRODUCT_QUALITY',
              );

              const BR_TECHNOLOGY = getPrediction(
                resultPredict, [
                  resultQuest.AVAILABLE_SYSTEM.length,
                ],
                'BR_TECHNOLOGY',
              );

              const preBRDCheck1 = JSON.stringify(resultQuest.MARKETING_TYPE).includes('Online Marketing');
              const preBRDCheck2 = preBRDCheck1 ? resultQuest.ONLINE_MARKETING_TYPE.length : 0;
              const BR_DEVELOPMENT_CAPACITY = getPrediction(
                resultPredict, [
                  resultQuest.MARKETING_TYPE,
                  preBRDCheck2,
                ],
                'BR_DEVELOPMENT_CAPACITY',
              );

              const LC_ORGANIZATION = getPrediction(
                resultPredict, [
                  resultQuest.OWNER_MANAGED_FLAG,
                  resultQuest.ORGANIZATION_STRUCTURE_FLAG,
                  resultQuest.EMPLOYEE_COUNT,
                ],
                'LC_ORGANIZATION',
              );

              const LC_PLANNING = getPrediction(
                resultPredict, [
                  resultQuest.SME_CLASS,
                  resultQuest.BUSINESS_OWNER_INVOLVE_PERCENTAGE,
                ],
                'LC_PLANNING',
              );

              const PR_STAFFING = getPrediction(
                resultPredict, [
                  resultQuest.EMPLOYEE_OJT_FLAG,
                  resultQuest.EMPLOYEE_SOP_FLAG,
                  resultQuest.EMPLOYEE_WRITTEN_CONTRACT_FLAG,
                  resultQuest.EMPLOYEE_COUNT_2YEARS,
                ],
                'PR_STAFFING',
              );

              const PR_STAFF_PERFORMANCE = getPrediction(
                resultPredict, [
                  resultQuest.EMPLOYEE_JD_KPI_FLAG,
                ],
                'PR_STAFF_PERFORMANCE',
              );

              const SR_EXECUTION_CAPACITY = getPrediction(
                resultPredict, [
                  resultQuest.OPERATIONAL_GUIDELINE_FLAG,
                ],
                'SR_EXECUTION_CAPACITY',
              );

              const SR_BUDGETTING = getPrediction(
                resultPredict, [
                  resultQuest.BUSINESS_PLAN_FLAG,
                  resultQuest.BUSINESS_FUTURE_PLAN.length,
                ],
                'SR_BUDGETTING',
              );

              const preFICheck1 = resultQuest.SEEK_FINANCING_2YEARS_FLAG === 'YES';
              const preFICheck2 = preFICheck1 ? resultQuest.SEEK_FINANCING_METHOD.length : 0;
              const FR_FINANCE = getPrediction(
                resultPredict, [
                  resultQuest.SEEK_FINANCING_2YEARS_FLAG,
                  resultQuest.LATE_PAYMENT_CUSTOMER,
                  preFICheck2,
                  resultQuest.CUSTOMER_PAYMENT_METHODS.length,
                ],
                'FR_FINANCE',
              );

              const FR_FINANCIAL_SYSTEM = getPrediction(
                resultPredict, [
                  resultQuest.REGISTERED_BANK_ACCOUNT_FLAG,
                  resultQuest.AUDIT_BUSINESS_ACCOUNT_FLAG,
                  resultQuest.SST_FLAG,
                ],
                'FR_FINANCIAL_SYSTEM',
              );

              resultScore = {
                IG_INDUSTRY_POTENTIAL,
                BR_PRODUCT_LINE,
                BR_PRODUCT_QUALITY,
                BR_TECHNOLOGY,
                BR_DEVELOPMENT_CAPACITY,
                LC_ORGANIZATION,
                LC_PLANNING,
                PR_STAFFING,
                PR_STAFF_PERFORMANCE,
                SR_EXECUTION_CAPACITY,
                SR_BUDGETTING,
                FR_FINANCE,
                FR_FINANCIAL_SYSTEM,
              };
            }

            if (resultScore
              && resultQuest.SME_CLASS !== 'LARGE ENTERPRISE'
              && resultQuest.SME_CLASS !== 'N/A') {
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
          company: resultCompany,
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
      if (input.ASSESSMENT_YEAR === 1000
        && !input.PUBLIC
        && checkPermission('ELSA-CREATE', userRoleList)) {
        // get elsa
        const [toStore] = finalResult
          .filter((i) => i.ASSESSMENT_YEAR === 1000)
          .map((j) => j.ELSA);

        // generate history
        const dbStoreScoreCard = toStore.map((b) => {
          const history = generateHistory(mail, 'CREATE');
          const newB = {
            ...b,
            ...history,
            ID: generateId(),
            COMPANY_ID: input.COMPANY_ID,
            MODULE: userRoleList.MODULE,
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
        const resElsaScore = await FileSlvELSAScorecard.findAll(searchOptsElsa);
        if (resElsaScore && resElsaScore.length !== 0) {
          await FileSlvELSAScorecard.delete(searchOptsElsa);
        }
        await FileSlvELSAScorecard.bulkCreate(dbStoreScoreCard);
      }

      return finalResult;
    }),
  },
  Mutation: {
    createElsa: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { FileSlvSurvey, FileSlvAssessment, FileSlvELSAScorecard },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('ELSA-CREATE', userRoleList)) throw new ForbiddenError();

      // survey
      const searchOptsSurvey = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resSurvey = await FileSlvSurvey.findOne(searchOptsSurvey);
      const surveyInput = resSurvey;
      const surveyHist = generateHistory(mail, 'CREATE');
      const finalSurvey = {
        ...surveyInput,
        ...surveyHist,
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        ID: generateId(),
      };
      await FileSlvSurvey.create(finalSurvey);

      // assessment
      const searchOptsAssess = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resAssess = await FileSlvAssessment.findOne(searchOptsAssess);
      const assessInput = resAssess;
      const assessHist = generateHistory(mail, 'CREATE');
      const finalAssess = {
        ...assessInput,
        ...assessHist,
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        ID: generateId(),
      };
      await FileSlvAssessment.create(finalAssess);

      // scorecard
      const searchOptsElsa = {
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
        },
      };
      const resElsa = await FileSlvELSAScorecard.findAll(searchOptsElsa);
      const elsaInput = resElsa.map((b) => {
        const preB = b;
        const history = generateHistory(mail, 'CREATE');
        const newB = {
          ...preB,
          ...history,
          ID: generateId(),
          ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
          COMPANY_ID: input.COMPANY_ID,
          MODULE: userRoleList.MODULE,
        };
        return newB;
      });
      await FileSlvELSAScorecard.bulkCreate(elsaInput);

      return input;
    }),
  },
};
