const { generateId, generateHistory } = require('../../../packages/mysql-model');
const {
  processSurveyResult, calculateScores, getTotalScore, checkPermission, getRoleWhere,
  getCurrentData, getFilteredData,
} = require('../../helper/common');
const { profileGroup, factorOrder } = require('../../helper/parameter');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { NoSurveyError, NoAssessmentError } = require('../../permissions/errors');
const logger = require('../../../packages/logger');
const {
  fullElsaListRule, elsaPriorityRule, oneElsaRule, oneAllRule, createElsaRule,
} = require('../../permissions/rule');

const emptyElsaData = {
  company: null,
  assessment: null,
  survey: null,
  msicDetails: null,
  ELSA: null,
  TOTAL_FINAL_SCORE: null,
  ASSESSMENT_YEAR: null,
};

/**
 * Generate data for Large Enterprise
 * @param {object} resultCompany
 * @param {object} resultQuest
 * @param {object} resultMSIC
 * @param {number} year
 * @returns
 */
const largeEnterpriseData = (resultCompany, resultQuest, resultMSIC, year) => ({
  company: resultCompany,
  assessment: null,
  survey: resultQuest,
  msicDetails: resultMSIC,
  ELSA: [],
  TOTAL_FINAL_SCORE: null,
  ASSESSMENT_YEAR: year,
});

/**
 * Get individual prediction value for a pair
 * @param {Object} resultPredict Prediction data
 * @param {string} fields field to check
 * @param {string} factor ELSA factor
 * @returns {number} value found from prediction data
 */
const getPrediction = (resultPredict, fields, factor) => {
  // prepare key
  const keySearchPre = fields.reduce((fullT, t) => `${fullT}${t}`, '');
  const keySearch = keySearchPre.replace(/\s+/g, '').toUpperCase();

  // filter key
  const keyDataPre = resultPredict
    .filter((x) => x.FACTOR === factor && x.KEY === keySearch);
  const keyData = keyDataPre.length !== 0 ? keyDataPre[0].VALUE : 2;
  return keyData;
};

/**
 * Generate ELSA score based on prediction
 * @param {Object} resultPredict Prediction data
 * @param {Object} resultQuest Survey data
 * @param {string} process name of the process calling the function
 * @returns {Object} contains ELSA Score based on prediction
 */
const generatePredictionData = (resultPredict, resultQuest, process) => {
  logger.debug(`${process} --> public detected, using prediction data...`);
  const IG_INDUSTRY_POTENTIAL = getPrediction(
    resultPredict,
    [
      resultQuest.YEARLY_BUSINESS_PERFORMANCE,
      resultQuest.YEARLY_INDUSTRY_PERFORMANCE,
    ],
    'IG_INDUSTRY_POTENTIAL',
  );
  logger.debug(`${process} --> IG_INDUSTRY_POTENTIAL: ${JSON.stringify(IG_INDUSTRY_POTENTIAL)}`);

  const BR_PRODUCT_LINE = getPrediction(
    resultPredict,
    [
      resultQuest.PRODUCT_COUNT,
      resultQuest.PRODUCT_PERFORMANCE_2YEARS,
      resultQuest.PRODUCT_MARKET_LOCATION,
    ],
    'BR_PRODUCT_LINE',
  );
  logger.debug(`${process} --> BR_PRODUCT_LINE: ${JSON.stringify(BR_PRODUCT_LINE)}`);

  const BR_PRODUCT_QUALITY = getPrediction(
    resultPredict,
    [
      resultQuest.PRODUCT_FEEDBACK_COLLECTION_FLAG,
    ],
    'BR_PRODUCT_QUALITY',
  );
  logger.debug(`${process} --> BR_PRODUCT_QUALITY: ${JSON.stringify(BR_PRODUCT_QUALITY)}`);

  const BR_TECHNOLOGY = getPrediction(
    resultPredict,
    [
      resultQuest.AVAILABLE_SYSTEM.length,
    ],
    'BR_TECHNOLOGY',
  );
  logger.debug(`${process} --> BR_TECHNOLOGY: ${JSON.stringify(BR_TECHNOLOGY)}`);

  const preBRDCheck1 = JSON.stringify(resultQuest.MARKETING_TYPE).includes('Online Marketing');
  const preBRDCheck2 = preBRDCheck1 ? resultQuest.ONLINE_MARKETING_TYPE.length : 0;
  logger.debug(`${process} --> pre BR_DEVELOPMENT_CAPACITY check: ${JSON.stringify(preBRDCheck2)}`);

  const BR_DEVELOPMENT_CAPACITY = getPrediction(
    resultPredict,
    [
      JSON.stringify(resultQuest.MARKETING_TYPE),
      preBRDCheck2,
    ],
    'BR_DEVELOPMENT_CAPACITY',
  );
  logger.debug(`${process} --> BR_DEVELOPMENT_CAPACITY: ${JSON.stringify(BR_DEVELOPMENT_CAPACITY)}`);

  const LC_ORGANIZATION = getPrediction(
    resultPredict,
    [
      resultQuest.OWNER_MANAGED_FLAG,
      resultQuest.ORGANIZATION_STRUCTURE_FLAG,
      resultQuest.EMPLOYEE_COUNT,
    ],
    'LC_ORGANIZATION',
  );
  logger.debug(`${process} --> LC_ORGANIZATION: ${JSON.stringify(LC_ORGANIZATION)}`);

  const LC_PLANNING = getPrediction(
    resultPredict,
    [
      resultQuest.SME_CLASS,
      resultQuest.BUSINESS_OWNER_INVOLVE_PERCENTAGE,
    ],
    'LC_PLANNING',
  );
  logger.debug(`${process} --> LC_PLANNING: ${JSON.stringify(LC_PLANNING)}`);

  const PR_STAFFING = getPrediction(
    resultPredict,
    [
      resultQuest.EMPLOYEE_OJT_FLAG,
      resultQuest.EMPLOYEE_SOP_FLAG,
      resultQuest.EMPLOYEE_WRITTEN_CONTRACT_FLAG,
      resultQuest.EMPLOYEE_COUNT_2YEARS,
    ],
    'PR_STAFFING',
  );
  logger.debug(`${process} --> PR_STAFFING: ${JSON.stringify(PR_STAFFING)}`);

  const PR_STAFF_PERFORMANCE = getPrediction(
    resultPredict,
    [
      resultQuest.EMPLOYEE_JD_KPI_FLAG,
    ],
    'PR_STAFF_PERFORMANCE',
  );
  logger.debug(`${process} --> PR_STAFF_PERFORMANCE: ${JSON.stringify(PR_STAFF_PERFORMANCE)}`);

  const SR_EXECUTION_CAPACITY = getPrediction(
    resultPredict,
    [
      resultQuest.OPERATIONAL_GUIDELINE_FLAG,
    ],
    'SR_EXECUTION_CAPACITY',
  );
  logger.debug(`${process} --> SR_EXECUTION_CAPACITY: ${JSON.stringify(SR_EXECUTION_CAPACITY)}`);

  const SR_BUDGETTING = getPrediction(
    resultPredict,
    [
      resultQuest.BUSINESS_PLAN_FLAG,
      resultQuest.BUSINESS_FUTURE_PLAN.length,
    ],
    'SR_BUDGETTING',
  );
  logger.debug(`${process} --> SR_BUDGETTING: ${JSON.stringify(SR_BUDGETTING)}`);

  const preFICheck1 = resultQuest.SEEK_FINANCING_2YEARS_FLAG === 'YES';
  const preFICheck2 = preFICheck1 ? resultQuest.SEEK_FINANCING_METHOD.length : 0;
  logger.debug(`${process} --> pre FR_FINANCE check: ${JSON.stringify(preFICheck2)}`);

  const FR_FINANCE = getPrediction(
    resultPredict,
    [
      resultQuest.SEEK_FINANCING_2YEARS_FLAG,
      resultQuest.LATE_PAYMENT_CUSTOMER,
      preFICheck2,
      resultQuest.CUSTOMER_PAYMENT_METHODS.length,
    ],
    'FR_FINANCE',
  );
  logger.debug(`${process} --> FR_FINANCE: ${JSON.stringify(FR_FINANCE)}`);

  const FR_FINANCIAL_SYSTEM = getPrediction(
    resultPredict,
    [
      resultQuest.REGISTERED_BANK_ACCOUNT_FLAG,
      resultQuest.AUDIT_BUSINESS_ACCOUNT_FLAG,
      resultQuest.SST_FLAG,
    ],
    'FR_FINANCIAL_SYSTEM',
  );
  logger.debug(`${process} --> FR_FINANCIAL_SYSTEM: ${JSON.stringify(FR_FINANCIAL_SYSTEM)}`);

  return {
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
};

module.exports = {
  Query: {
    /**
     * Retrieve ELSA data grouped by lifecycle status
     * @param {Object} param0 main input object
     * @param {Object} param0.filter filter to be applied
     */
    fullElsaList: isAuthenticatedResolver.createResolver(async (
      parent,
      { filter },
      {
        connectors: { MysqlSlvCompanyProfile, MysqlSlvELSAScorecard, MysqlSlvSurvey },
        user: { mail, userRoleList, userType },
      },
    ) => {
      logger.info(`fullElsaList --> by ${mail} called with filter ${JSON.stringify(filter)}`);
      checkPermission(fullElsaListRule, userRoleList, userType, 'fullElsaList');

      let result = [];
      let resultCompany = [];

      const where = getRoleWhere(userRoleList, mail);
      const searchOpts = { where };
      const searchOptsAll = { where: null };

      // survey
      const resultQuest = await getCurrentData(MysqlSlvSurvey, searchOptsAll, 'fullElsaList', 'survey');

      // ELSA
      const resultElsa = await getCurrentData(MysqlSlvELSAScorecard, searchOptsAll, 'fullElsaList', 'ELSA Scorecard');

      // company
      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      logger.debug(`fullElsaList --> total company found: ${resCompany.length}`);

      resultCompany = resCompany
        .map((x) => {
          const resC = x.dataValues;
          const resQ = resultQuest.filter((y) => y.COMPANY_ID === resC.ID);

          const resQ1 = resQ.length !== 0 ? resQ[0] : null;

          return {
            ...resQ1,
            ...resC,
            SURVEY_DONE: resQ.length,
          };
        })
        .filter((cls) => cls.SME_CLASS && cls.SME_CLASS !== 'LARGE ENTERPRISE' && cls.SME_CLASS !== 'N/A')
        .filter((as) => as.SURVEY_DONE !== 0);

      resultCompany = getFilteredData(resultCompany, filter);

      // calculate socre for each company
      const scoreArray = resultCompany
        .map((cm) => {
          const scorecard = resultElsa.filter((cmp) => cmp.COMPANY_ID === cm.COMPANY_ID);
          if (scorecard.length === 0) return 0;

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

      logger.debug(`fullElsaList --> output: ${JSON.stringify(result)}`);
      logger.info(`fullElsaList --> by ${mail} completed`);
      return result;
    }),
    /**
         * Get group by data based on column
         * @param {Object} param0 main input object
         * @param {Object} param0.filter filter to be applied
         */
    elsaPriority: isAuthenticatedResolver.createResolver(async (
      parent,
      { filter },
      {
        connectors: {
          MysqlSlvELSAScorecard, MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment,
        },
        user: { mail, userRoleList, userType },
      },
    ) => {
      logger.info(`elsaPriority --> by ${mail} called with filter ${JSON.stringify(filter)}`);
      checkPermission(elsaPriorityRule, userRoleList, userType, 'elsaPriority');

      let resultCompany = [];
      let resultELSA = [];

      const where = getRoleWhere(userRoleList, mail);
      const searchOpts = { where };
      const searchOptsAll = { where: null };

      // ELSA
      resultELSA = await getCurrentData(MysqlSlvELSAScorecard, searchOptsAll, 'elsaPriority', 'ELSA Scorecard');

      // Assessment
      const resultScore = await getCurrentData(MysqlSlvAssessment, searchOptsAll, 'elsaPriority', 'assessment');

      // Survey
      const resultQuest = await getCurrentData(MysqlSlvSurvey, searchOptsAll, 'elsaPriority', 'survey');

      // company
      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      logger.debug(`elsaPriority --> company found: ${JSON.stringify(resCompany)}`);

      resultCompany = resCompany
        .map((x) => {
          const resC = x.dataValues;
          const resQ = resultQuest.filter((y) => y.COMPANY_ID === resC.ID);
          const resS = resultScore.filter((z) => z.COMPANY_ID === resC.ID);

          const resQ1 = resQ.length !== 0 ? resQ[0] : null;
          const resS1 = resS.length !== 0 ? resS[0] : null;

          return {
            ...resQ1,
            ...resS1,
            ...resC,
            SURVEY_DONE: resQ.length,
            ASSESSMENT_DONE: resS.length,
          };
        })
        .filter((cls) => cls.SME_CLASS && cls.SME_CLASS !== 'LARGE ENTERPRISE' && cls.SME_CLASS !== 'N/A')
        .filter(((as) => as.SURVEY_DONE !== 0));

      resultCompany = getFilteredData(resultCompany, filter);

      const companyList = resultCompany.map((cm) => cm.COMPANY_ID);

      resultELSA = resultELSA
        .filter((e) => companyList.includes(e.COMPANY_ID))
        .map((el) => ({
          FACTOR: el.FACTOR,
          PRIORITY_ACTION_TAKEN: el.PRIORITY_ACTION_TAKEN,
        }));

      // console.log(uniqueColumn);
      const data = factorOrder.map((f) => {
        const res = resultELSA.filter((re) => re.FACTOR === f && re.PRIORITY_ACTION_TAKEN);
        return {
          KEY: f,
          VALUE: res.length,
        };
      });

      const finalResult = {
        data,
      };

      logger.debug(`elsaPriority --> output: ${JSON.stringify(resultELSA)}`);
      logger.info(`elsaPriority --> by ${mail} completed`);

      return finalResult;
    }),
    /**
     * Retrieve one by Company ID and Assessment Year
     * @param {Object} param0 main input object
     * @param {String} param0.input contains company id and assessment year
     */
    oneElsa: isAuthenticatedResolver.createResolver(async (parent, { input }, {
      connectors: {
        MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvELSAScorecard, MysqlSlvPrediction,
      },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`oneElsa --> by ${mail} input: ${JSON.stringify(input)}`);
      checkPermission(oneElsaRule, userRoleList, userType, 'oneElsa');

      const searchOpts = {
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        },
      };
      const searchOptsAll = { where: null };

      // prediction
      const resPredict = await MysqlSlvPrediction.findAll(searchOptsAll);
      const resultPredict = resPredict.map((a) => a.dataValues);
      logger.debug(`oneElsa --> ELSA prediction found: ${JSON.stringify(resultPredict)}`);

      // survey
      const resQuest = await MysqlSlvSurvey.findAll(searchOpts);
      const resultQuest = resQuest.length !== 0
        ? resQuest.map((s) => s.dataValues)
        : resQuest;
      if (resultQuest.length === 0) {
        logger.error('oneElsa --> No survey found');
        throw new NoSurveyError();
      }
      logger.debug(`oneElsa --> total survey found: ${resultQuest.length}`);

      const resScore = await MysqlSlvAssessment.findAll(searchOpts);
      let resultScore = resScore.length !== 0
        ? resScore.map((a) => a.dataValues)[0]
        : resScore;
      logger.debug(`oneElsa --> total assessment found: ${resultScore.length}`);

      if (resultScore.length === 0) {
        resultScore = generatePredictionData(resultPredict, resultQuest, 'oneElsa');
      }

      const resElsa = await MysqlSlvELSAScorecard.findAll(searchOpts);
      const resultElsa = resElsa.length !== 0
        ? resElsa.map((a) => a.dataValues)
        : resElsa;
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
      parent,
      { input },
      {
        connectors:
        {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvMSIC,
          MysqlSlvELSAScorecard, MysqlSlvPrediction, MysqlSlvELSAWeightage,
        },
        user: { mail, userRoleList, userType },
      },
    ) => {
      logger.info(`oneAll --> by ${mail} input: ${JSON.stringify(input)}`);
      checkPermission(oneAllRule, userRoleList, userType, 'oneAll');

      // company
      const searchOpts = { where: { COMPANY_ID: input.COMPANY_ID } };
      const searchOptsElsa = {
        where: {
          COMPANY_ID: input.COMPANY_ID,
          PREDICTION: input.PUBLIC ? 'YES' : 'NO',
        },
      };
      const searchOptsAll = { where: null };

      const resCompany = await MysqlSlvCompanyProfile.findById(input.COMPANY_ID);

      // no company, return null
      if (!resCompany) {
        return [emptyElsaData];
      }

      const resultCompany = {
        ...resCompany.dataValues,
        LOGO: JSON.parse(resCompany.dataValues.LOGO),
        MODULE: JSON.parse(resCompany.dataValues.MODULE),
      };
      logger.debug(`oneAll --> company found: ${JSON.stringify(resultCompany)}`);

      // survey
      const resQuestPre = await MysqlSlvSurvey.findAll(searchOpts);
      const resQuest = resQuestPre.length !== 0
        ? resQuestPre.map((s) => s.dataValues)
        : resQuestPre;
      if (resQuestPre.length === 0) {
        logger.error('oneAll --> No survey found');
        throw new NoSurveyError();
      }
      logger.debug(`oneAll --> survey found: ${JSON.stringify(resQuest)}`);

      // assessment
      const resScorePre = await MysqlSlvAssessment.findAll(searchOpts);
      const resScore = resScorePre.length !== 0
        ? resScorePre.map((a) => a.dataValues)
        : resScorePre;
      if (resScorePre.length === 0 && !input.PUBLIC) {
        logger.error('oneAll --> No assessment found');
        throw new NoAssessmentError();
      }
      logger.debug(`oneAll --> assessment found: ${JSON.stringify(resScore)}`);

      // ELSA
      const resElsaPre = await MysqlSlvELSAScorecard.findAll(searchOptsElsa);
      const resElsa = resElsaPre.length !== 0
        ? resElsaPre.map((a) => a.dataValues)
        : resElsaPre;
      logger.debug(`oneAll --> ELSA scorecard found: ${JSON.stringify(resElsa)}`);

      // MSIC
      const searchOpts2 = { where: { SECTION: resultCompany.SECTION } };
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
      const uniqueYear = [...new Set(yearOnly)];
      const yearList = uniqueYear.includes(1000) ? uniqueYear : [1000, ...uniqueYear];
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

            if (resultQuest.SME_CLASS === 'LARGE ENTERPRISE') {
              logger.debug('oneAll --> Large Enterprise detected');
              return largeEnterpriseData(resultCompany, resultQuest, resultMSIC, yr);
            }

            // assessment
            const resultScorePre = resScore
              .map((as) => ({
                ...as,
                MODULE: JSON.parse(as.MODULE),
              }))
              .filter((w) => w.ASSESSMENT_YEAR === 1000);
            resultScore = resultScorePre.length !== 0 ? resultScorePre[0] : null;
            logger.debug(`oneAll --> Assessment found: ${JSON.stringify(resultScore)}`);

            if (resultQuest.SME_CLASS === 'LARGE ENTERPRISE') {
              logger.debug('oneAll --> Large Enterprise detected');

              const result = {
                company: resultCompany,
                assessment: resultScore,
                survey: resultQuest,
                msicDetails: resultMSIC,
                ELSA: [],
                TOTAL_FINAL_SCORE: null,
                ASSESSMENT_YEAR: yr,
              };
              return result;
            }

            // intercept public here
            if (input.PUBLIC) {

              resultScore = generatePredictionData(resultPredict, resultQuest, 'oneAll');
            }

            if (resultScore && resultQuest.SME_CLASS !== 'N/A') {
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
            return emptyElsaData;
          }
          // process result
          const processedResult = processSurveyResult(resultQuest);
          resultQuest = {
            ...resultQuest,
            ...processedResult,
          };

          if (resultQuest.SME_CLASS === 'LARGE ENTERPRISE') {
            logger.debug('oneAll --> Large Enterprise detected');
            return largeEnterpriseData(resultCompany, resultQuest, resultMSIC, yr);
          }

          // assessment
          [resultScore] = resScore
            .map((as) => ({
              ...as,
              MODULE: JSON.parse(as.MODULE),
            }))
            .filter((y) => y.ASSESSMENT_YEAR === yr);

          // ELSA
          const resultElsa = resElsa
            .map((as) => ({
              ...as,
              MODULE: JSON.parse(as.MODULE),
            }))
            .filter((e) => e.ASSESSMENT_YEAR === yr);
          scorecard = resultElsa.map((d) => {
            const nextDesiredScore = d.NEXT_DESIRED_SCORE === 'N/A'
              ? d.NEXT_DESIRED_SCORE
              : parseFloat(d.NEXT_DESIRED_SCORE);

            return ({
              ...d,
              FINAL_SCORE: parseFloat(d.FINAL_SCORE),
              FINAL_SCORE_ROUNDDOWN: parseFloat(d.FINAL_SCORE_ROUNDDOWN),
              NEXT_DESIRED_SCORE: nextDesiredScore,
            });
          });
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
      if (input.ASSESSMENT_YEAR === 1000) {
        // get elsa
        logger.debug('oneAll --> storing calculated ELSA score in DB');
        const PREDICTION = input.PUBLIC ? 'YES' : 'NO';

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
            PREDICTION,
            MODULE: JSON.stringify(resultCompany.MODULE),
          };
          return newB;
        });

        // remove and recreate with new value
        const searchOptsElsaDB = {
          where: {
            COMPANY_ID: input.COMPANY_ID,
            ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
            PREDICTION,
          },
        };
        const resElsaScore = await MysqlSlvELSAScorecard.findAll(searchOptsElsaDB);
        logger.debug(`oneAll --> ELSA Score found in DB: ${JSON.stringify(resElsaScore)}`);

        if (resElsaScore && resElsaScore.length !== 0) {
          await MysqlSlvELSAScorecard.delete(searchOptsElsaDB);
        }
        await MysqlSlvELSAScorecard.bulkCreate(dbStoreScoreCard);
      }

      logger.debug(`oneAll --> output: ${JSON.stringify(finalResult)}`);
      logger.info(`oneAll --> by ${mail} completed`);
      return finalResult;
    }),
  },
  Mutation: {
    createElsa: isAuthenticatedResolver.createResolver(async (parent, { input }, {
      connectors: { MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvELSAScorecard },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`createElsa --> by ${mail} input: ${JSON.stringify(input)}`);
      checkPermission(createElsaRule, userRoleList, userType, 'createElsa');

      const searchOpts = { where: { COMPANY_ID: input.COMPANY_ID } };
      // survey
      const resSurvey = await MysqlSlvSurvey.findOne(searchOpts);
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
      const resAssess = await MysqlSlvAssessment.findOne(searchOpts);
      if (resAssess) {
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
      }

      if (surveyInput.SME_CLASS !== 'LARGE ENTERPRISE') {
        logger.debug('createElsa --> not a LARGE ENTERPRISE. processing ELSA');

        // scorecard
        const searchOptsElsa = {
          where: {
            COMPANY_ID: input.COMPANY_ID,
            ASSESSMENT_YEAR: 1000,
            PREDICTION: input.PUBLIC ? 'YES' : 'NO',
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
            MODULE: surveyInput.MODULE,
          };
          return newB;
        });
        const resultCreateElsa = await MysqlSlvELSAScorecard.bulkCreate(elsaInput);
        logger.debug(`createElsa --> ELSA scorecard created: ${JSON.stringify(resultCreateElsa)}`);
      }

      logger.debug(`createElsa --> output: ${JSON.stringify(input)}`);
      logger.info(`createElsa --> by ${mail} completed`);

      return input;
    }),
  },
};
