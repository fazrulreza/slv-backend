const { generateId, generateHistory } = require('../../../packages/mysql-model');
const {
  processSurveyResult, calculateScores, getTotalScore, checkPermission, getRoleWhere,
} = require('../../helper/common');
const { profileGroup } = require('../../helper/parameter');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');
const logger = require('../../../packages/logger');

const getPrediction = (resultPredict, fields, factor) => {
  // prepare key
  const keySearchPre = fields.reduce((fullT, t) => `${fullT}${t}`, '');
  const keySearch = keySearchPre.replace(/\s+/g, '').toUpperCase();

  // filter key
  const keyDataPre = resultPredict
    .filter((x) => x.FACTOR === factor && x.KEY === keySearch);
  const keyData = keyDataPre.length !== 0 ? keyDataPre[0].VALUE : 2;
  // console.log(factor, keySearch);
  // console.log(keyData);
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
        connectors: { MysqlSlvCompanyProfile, MysqlSlvELSAScorecard, MysqlSlvSurvey },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`fullElsaList --> by ${mail} called with no input`);

      if (!checkPermission('ELSA-READ', userRoleList)) throw new ForbiddenError();
      logger.debug('fullElsaList --> Permission check passed');

      let result = [];
      let resultCompany = [];
      let resultQuest = [];
      let resultElsa = [];

      const where = getRoleWhere(userRoleList, mail);
      const searchOpts = { where };
      const searchOptsAll = { where: null };

      // company
      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      if (resCompany.length !== 0) {
        resultCompany = resCompany.map((x) => x.dataValues.ID);
      }
      logger.debug(`fullElsaList --> total company found: ${resCompany.length}`);

      // survey
      const resQuest = await MysqlSlvSurvey.findAll(searchOpts);
      logger.debug(`fullElsaList --> total survey found: ${resQuest.length}`);
      if (resQuest.length !== 0) {
        resultQuest = resQuest
          .map((s) => s.dataValues)
          .filter((oa) => oa.ASSESSMENT_YEAR === 1000)
          .filter((cls) => cls.SME_CLASS !== 'LARGE ENTERPRISE' && cls.SME_CLASS !== 'N/A')
          .map((sv) => sv.COMPANY_ID);
      }

      // ELSA
      const resElsa = await MysqlSlvELSAScorecard.findAll(searchOptsAll);
      logger.debug(`fullElsaList --> total ELSA Scorecard found: ${resElsa.length}`);
      if (resElsa.length !== 0) {
        resultElsa = resElsa
          .map((j) => j.dataValues)
          .filter((oa) => oa.ASSESSMENT_YEAR === 1000);
      }

      if (resultCompany.length !== 0 && resultQuest.length !== 0 && resultElsa.length !== 0) {
        logger.debug('fullElsaList --> all queries has length != 0');
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
        logger.debug(`fullElsaList --> Total company with ELSA score: ${noZeroScoreArray.length}`);

        if (noZeroScoreArray.length !== 0) {
          result = Object.keys(profileGroup)
            .map((k) => ({
              stage: k,
              count: noZeroScoreArray.filter((m) => m === (parseInt(k, 10))).length,
            }));
        }
      }

      logger.debug(`fullElsaList --> output: ${JSON.stringify(result)}`);
      logger.info(`fullElsaList --> by ${mail} completed`);
      return result;
    }),
    oneElsa: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvAssessment, MysqlSlvELSAScorecard },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`oneElsa --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('ELSA-READ', userRoleList)) throw new ForbiddenError();
      logger.debug('oneElsa --> Permission check passed');

      const searchOpts = {
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        },
      };

      const resScore = await MysqlSlvAssessment.findAll(searchOpts);
      const resultScore = resScore.length !== 0 ? resScore.map((a) => a.dataValues) : resScore;
      logger.debug(`oneElsa --> total assessment found: ${resultScore.length}`);

      const resElsa = await MysqlSlvELSAScorecard.findAll(searchOpts);
      const resultElsa = resElsa.length !== 0 ? resElsa.map((a) => a.dataValues) : resElsa;
      logger.debug(`oneElsa --> total ELSA Scorecard found: ${resultElsa.length}`);

      // calculate total score
      const totalFinalScore = getTotalScore(resultElsa);

      const result = {
        assessment: resultScore[0],
        ELSA: resultElsa,
        TOTAL_FINAL_SCORE: totalFinalScore,
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
      };
      logger.debug(`oneElsa --> output: ${JSON.stringify(result)}`);
      logger.info(`oneElsa --> by ${mail} completed`);

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
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment,
          MysqlSlvMSIC, MysqlSlvELSAScorecard, MysqlSlvPrediction, MysqlSlvELSAWeightage,
        },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`oneAll --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('ELSA-READ', userRoleList)) throw new ForbiddenError();
      logger.debug('oneAll --> Permission check passed');

      // company
      const searchOpts = { where: { COMPANY_ID: input.COMPANY_ID } };
      const searchOptsAll = { where: null };

      const resCompany = await MysqlSlvCompanyProfile.findById(input.COMPANY_ID);

      // no company, return null
      if (!resCompany) {
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

      const resultCompany = {
        ...resCompany.dataValues,
        LOGO: JSON.parse(resCompany.dataValues.LOGO),
      };
      logger.debug(`oneAll --> company found: ${JSON.stringify(resultCompany)}`);

      // survey
      const resQuestPre = await MysqlSlvSurvey.findAll(searchOpts);
      const resQuest = resQuestPre.length !== 0
        ? resQuestPre.map((s) => s.dataValues)
        : resQuestPre;
      logger.debug(`oneAll --> survey found: ${JSON.stringify(resQuest)}`);

      // assessment
      const resScorePre = await MysqlSlvAssessment.findAll(searchOpts);
      const resScore = resScorePre.length !== 0
        ? resScorePre.map((a) => a.dataValues)
        : resScorePre;
      logger.debug(`oneAll --> assessment found: ${JSON.stringify(resScore)}`);

      // ELSA
      const resElsaPre = await MysqlSlvELSAScorecard.findAll(searchOpts);
      const resElsa = resElsaPre.length !== 0
        ? resElsaPre.map((a) => a.dataValues)
        : resElsaPre;
      logger.debug(`oneAll --> ELSA scorecard found: ${JSON.stringify(resElsa)}`);

      // MSIC
      const searchOpts2 = { where: { MSIC: resultCompany.MSIC } };
      const resMSIC = await MysqlSlvMSIC.findOne(searchOpts2);
      const resultMSIC = resMSIC ? resMSIC.dataValues : null;

      // prediction
      const resPredict = await MysqlSlvPrediction.findAll(searchOptsAll);
      const resultPredict = resPredict.map((a) => a.dataValues);
      logger.debug(`oneAll --> ELSA prediction found: ${JSON.stringify(resultPredict)}`);

      // elsa weightage
      const resElsaWeightage = await MysqlSlvELSAWeightage.findAll(searchOptsAll);
      const resultElsaWeightage = resElsaWeightage.map((a) => a.dataValues);
      logger.debug(`oneAll --> ELSA weightage found: ${JSON.stringify(resultElsaWeightage)}`);

      // get all unique assessment year
      const yearOnly = resElsaPre.length !== 0
        ? resElsaPre.map((e) => e.dataValues.ASSESSMENT_YEAR)
        : [input.ASSESSMENT_YEAR];
      const uniqueYear = yearOnly.filter((item, index) => yearOnly.indexOf(item) === index);
      const yearList = uniqueYear.includes(1000) ? uniqueYear : [...uniqueYear, 1000];
      logger.debug(`oneAll --> Year list: ${JSON.stringify(yearList)}`);

      const finalResult = yearList.map((yr) => {
        let resultQuest = null;
        let resultScore = null;
        let scorecard = [];
        let totalFinalScore = 0;

        if (yr === 1000) {
          logger.debug('oneAll --> year 1000 / current');
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
            logger.debug(`oneAll --> Survey found: ${JSON.stringify(resultQuest)}`);

            // assessment
            const resultScorePre = resScore.filter((w) => w.ASSESSMENT_YEAR === 1000);
            resultScore = resultScorePre.length !== 0 ? resultScorePre[0] : null;
            logger.debug(`oneAll --> Assessment found: ${JSON.stringify(resultScore)}`);

            // intercept public here
            if (input.PUBLIC) {
              logger.debug('oneAll --> public detected, using prediction data...');
              const IG_INDUSTRY_POTENTIAL = getPrediction(
                resultPredict, [
                  resultQuest.YEARLY_BUSINESS_PERFORMANCE,
                  resultQuest.YEARLY_INDUSTRY_PERFORMANCE,
                ],
                'IG_INDUSTRY_POTENTIAL',
              );
              logger.debug(`oneAll --> IG_INDUSTRY_POTENTIAL: ${JSON.stringify(IG_INDUSTRY_POTENTIAL)}`);

              const BR_PRODUCT_LINE = getPrediction(
                resultPredict, [
                  resultQuest.PRODUCT_COUNT,
                  resultQuest.PRODUCT_PERFORMANCE_2YEARS,
                  resultQuest.PRODUCT_MARKET_LOCATION,
                ],
                'BR_PRODUCT_LINE',
              );
              logger.debug(`oneAll --> BR_PRODUCT_LINE: ${JSON.stringify(BR_PRODUCT_LINE)}`);

              const BR_PRODUCT_QUALITY = getPrediction(
                resultPredict, [
                  resultQuest.PRODUCT_FEEDBACK_COLLECTION_FLAG,
                ],
                'BR_PRODUCT_QUALITY',
              );
              logger.debug(`oneAll --> BR_PRODUCT_QUALITY: ${JSON.stringify(BR_PRODUCT_QUALITY)}`);

              const BR_TECHNOLOGY = getPrediction(
                resultPredict, [
                  resultQuest.AVAILABLE_SYSTEM.length,
                ],
                'BR_TECHNOLOGY',
              );
              logger.debug(`oneAll --> BR_TECHNOLOGY: ${JSON.stringify(BR_TECHNOLOGY)}`);

              const preBRDCheck1 = JSON.stringify(resultQuest.MARKETING_TYPE).includes('Online Marketing');
              const preBRDCheck2 = preBRDCheck1 ? resultQuest.ONLINE_MARKETING_TYPE.length : 0;
              logger.debug(`oneAll --> pre BR_DEVELOPMENT_CAPACITY check: ${JSON.stringify(preBRDCheck2)}`);

              const BR_DEVELOPMENT_CAPACITY = getPrediction(
                resultPredict, [
                  JSON.stringify(resultQuest.MARKETING_TYPE),
                  preBRDCheck2,
                ],
                'BR_DEVELOPMENT_CAPACITY',
              );
              logger.debug(`oneAll --> BR_DEVELOPMENT_CAPACITY: ${JSON.stringify(BR_DEVELOPMENT_CAPACITY)}`);

              const LC_ORGANIZATION = getPrediction(
                resultPredict, [
                  resultQuest.OWNER_MANAGED_FLAG,
                  resultQuest.ORGANIZATION_STRUCTURE_FLAG,
                  resultQuest.EMPLOYEE_COUNT,
                ],
                'LC_ORGANIZATION',
              );
              logger.debug(`oneAll --> LC_ORGANIZATION: ${JSON.stringify(LC_ORGANIZATION)}`);

              const LC_PLANNING = getPrediction(
                resultPredict, [
                  resultQuest.SME_CLASS,
                  resultQuest.BUSINESS_OWNER_INVOLVE_PERCENTAGE,
                ],
                'LC_PLANNING',
              );
              logger.debug(`oneAll --> LC_PLANNING: ${JSON.stringify(LC_PLANNING)}`);

              const PR_STAFFING = getPrediction(
                resultPredict, [
                  resultQuest.EMPLOYEE_OJT_FLAG,
                  resultQuest.EMPLOYEE_SOP_FLAG,
                  resultQuest.EMPLOYEE_WRITTEN_CONTRACT_FLAG,
                  resultQuest.EMPLOYEE_COUNT_2YEARS,
                ],
                'PR_STAFFING',
              );
              logger.debug(`oneAll --> PR_STAFFING: ${JSON.stringify(PR_STAFFING)}`);

              const PR_STAFF_PERFORMANCE = getPrediction(
                resultPredict, [
                  resultQuest.EMPLOYEE_JD_KPI_FLAG,
                ],
                'PR_STAFF_PERFORMANCE',
              );
              logger.debug(`oneAll --> PR_STAFF_PERFORMANCE: ${JSON.stringify(PR_STAFF_PERFORMANCE)}`);

              const SR_EXECUTION_CAPACITY = getPrediction(
                resultPredict, [
                  resultQuest.OPERATIONAL_GUIDELINE_FLAG,
                ],
                'SR_EXECUTION_CAPACITY',
              );
              logger.debug(`oneAll --> SR_EXECUTION_CAPACITY: ${JSON.stringify(SR_EXECUTION_CAPACITY)}`);

              const SR_BUDGETTING = getPrediction(
                resultPredict, [
                  resultQuest.BUSINESS_PLAN_FLAG,
                  resultQuest.BUSINESS_FUTURE_PLAN.length,
                ],
                'SR_BUDGETTING',
              );
              logger.debug(`oneAll --> SR_BUDGETTING: ${JSON.stringify(SR_BUDGETTING)}`);

              const preFICheck1 = resultQuest.SEEK_FINANCING_2YEARS_FLAG === 'YES';
              const preFICheck2 = preFICheck1 ? resultQuest.SEEK_FINANCING_METHOD.length : 0;
              logger.debug(`oneAll --> pre FR_FINANCE check: ${JSON.stringify(preFICheck2)}`);

              const FR_FINANCE = getPrediction(
                resultPredict, [
                  resultQuest.SEEK_FINANCING_2YEARS_FLAG,
                  resultQuest.LATE_PAYMENT_CUSTOMER,
                  preFICheck2,
                  resultQuest.CUSTOMER_PAYMENT_METHODS.length,
                ],
                'FR_FINANCE',
              );
              logger.debug(`oneAll --> FR_FINANCE: ${JSON.stringify(FR_FINANCE)}`);

              const FR_FINANCIAL_SYSTEM = getPrediction(
                resultPredict, [
                  resultQuest.REGISTERED_BANK_ACCOUNT_FLAG,
                  resultQuest.AUDIT_BUSINESS_ACCOUNT_FLAG,
                  resultQuest.SST_FLAG,
                ],
                'FR_FINANCIAL_SYSTEM',
              );
              logger.debug(`oneAll --> FR_FINANCIAL_SYSTEM: ${JSON.stringify(FR_FINANCIAL_SYSTEM)}`);

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
              logger.debug('oneAll --> calculating scores...');

              const getClassScore = Object.keys(resultScore)
                .map((y) => {
                  const unitClassScorePre = resultElsaWeightage
                    .filter((u) => u.SUBFACTOR === y && u.SIZE === resultQuest.SME_CLASS);

                  const getUnitClassScore = unitClassScorePre.length !== 0
                    ? unitClassScorePre[0].VALUE
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
                });

              // console.log(getClassScore);

              // get big class Score
              const BR_GROUP = calculateScores(getClassScore, 'BR_', yr);
              logger.debug(`oneAll --> BR_GROUP: ${JSON.stringify(BR_GROUP)}`);

              const LC_GROUP = calculateScores(getClassScore, 'LC_', yr);
              logger.debug(`oneAll --> LC_GROUP: ${JSON.stringify(LC_GROUP)}`);

              const PR_GROUP = calculateScores(getClassScore, 'PR_', yr);
              logger.debug(`oneAll --> PR_GROUP: ${JSON.stringify(PR_GROUP)}`);

              const SR_GROUP = calculateScores(getClassScore, 'SR_', yr);
              logger.debug(`oneAll --> SR_GROUP: ${JSON.stringify(SR_GROUP)}`);

              const FR_GROUP = calculateScores(getClassScore, 'FR_', yr);
              logger.debug(`oneAll --> FR_GROUP: ${JSON.stringify(FR_GROUP)}`);

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
            logger.debug('oneAll --> no survey found. returning null...');
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
          logger.debug(`oneAll --> calculated ELSA scorecard: ${JSON.stringify(scorecard)}`);
        }

        // calculate total score
        totalFinalScore = getTotalScore(scorecard);
        logger.debug(`oneAll --> final ELSA Score: ${JSON.stringify(totalFinalScore)}`);

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
        logger.debug('oneAll --> storing calculated ELSA score in DB');

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
            MODULE: userRoleList.MODULE === 'ALL' ? 'SME' : userRoleList.MODULE,
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
        logger.debug(`oneAll --> ELSA Score found in DB: ${JSON.stringify(resElsaScore)}`);

        if (resElsaScore && resElsaScore.length !== 0) {
          await MysqlSlvELSAScorecard.delete(searchOptsElsa);
        }
        await MysqlSlvELSAScorecard.bulkCreate(dbStoreScoreCard);
      }

      logger.debug(`oneAll --> output: ${JSON.stringify(finalResult)}`);
      logger.info(`oneAll --> by ${mail} completed`);
      return finalResult;
    }),
  },
  Mutation: {
    createElsa: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvELSAScorecard },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`createElsa --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('ELSA-CREATE', userRoleList)) throw new ForbiddenError();
      logger.debug('createElsa --> Permission check passed');

      // survey
      const searchOptsSurvey = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resSurvey = await MysqlSlvSurvey.findOne(searchOptsSurvey);
      const surveyInput = resSurvey.dataValues;
      logger.debug(`createElsa --> survey found: ${JSON.stringify(surveyInput)}`);

      const surveyHist = generateHistory(mail, 'CREATE');
      const finalSurvey = {
        ...surveyInput,
        ...surveyHist,
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        ID: generateId(),
      };
      const resultCreateSurvey = await MysqlSlvSurvey.create(finalSurvey);
      logger.debug(`createElsa --> created survey: ${JSON.stringify(resultCreateSurvey)}`);

      // assessment
      const searchOptsAssess = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resAssess = await MysqlSlvAssessment.findOne(searchOptsAssess);
      const assessInput = resAssess.dataValues;
      logger.debug(`createElsa --> assessment found: ${JSON.stringify(assessInput)}`);

      const assessHist = generateHistory(mail, 'CREATE');
      const finalAssess = {
        ...assessInput,
        ...assessHist,
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        ID: generateId(),
      };
      const resultCreateAssess = await MysqlSlvAssessment.create(finalAssess);
      logger.debug(`createElsa --> created assessment: ${JSON.stringify(resultCreateAssess)}`);

      // scorecard
      const searchOptsElsa = {
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
        },
      };
      const resElsa = await MysqlSlvELSAScorecard.findAll(searchOptsElsa);
      logger.debug(`createElsa --> ELSA scorecard found: ${JSON.stringify(resElsa)}`);

      const elsaInput = resElsa.map((b) => {
        const preB = b.dataValues;
        const history = generateHistory(mail, 'CREATE');
        const newB = {
          ...preB,
          ...history,
          ID: generateId(),
          ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
          COMPANY_ID: input.COMPANY_ID,
          MODULE: userRoleList.MODULE === 'ALL' ? 'SME' : userRoleList.MODULE,
        };
        return newB;
      });
      const resultCreateElsa = await MysqlSlvELSAScorecard.bulkCreate(elsaInput);
      logger.debug(`createElsa --> ELSA scorecard created: ${JSON.stringify(resultCreateElsa)}`);

      logger.debug(`createElsa --> output: ${JSON.stringify(input)}`);
      logger.info(`createElsa --> by ${mail} completed`);

      return input;
    }),
  },
};
