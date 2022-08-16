const flatten = require('lodash/flatten');
const moment = require('moment');
const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { getTotalScore, checkPermission } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');
const logger = require('../../../packages/logger');

const processGetxData = (input, mail, modul, create = true) => {
  const parsedInput = JSON.parse(input.data);

  // separate KPI and achievement fields
  const {
    // kpi
    BUS_OWNER_NAME,
    BUS_OWNER_DATE,
    BUS_OWNER,
    BUS_COACH_NAME,
    BUS_COACH_DATE,
    BUS_COACH,
    CHECKER_NAME,
    CHECKER_DATE,
    CHECKER,
    SIGN_KPI_ID,
    // achievement
    BUS_OWNER_ACTUAL_NAME,
    BUS_OWNER_ACTUAL_DATE,
    BUS_OWNER_ACTUAL,
    BUS_COACH_ACTUAL_NAME,
    BUS_COACH_ACTUAL_DATE,
    BUS_COACH_ACTUAL,
    CHECKER_ACTUAL_NAME,
    CHECKER_ACTUAL_DATE,
    CHECKER_ACTUAL,
    SIGN_ACTUAL_ID,
    // attachment
    TURNOVER_ATTACHMENT,
    PROFITABILITY_ATTACHMENT,
    SKILLED_ATTACHMENT,
    UNSKILLED_ATTACHMENT,
    EXPORT_REVENUE_ATTACHMENT,
    DIVERSIFY_ATTACHMENT,
    TECHNOLOGY_ATTACHMENT,
    NG_ATTACHMENT,
    FILE_ATTACHMENT,
    ATTACHMENT_ID,
    // others
    ...others
  } = parsedInput;

  // generate created updated fields
  const history = create
    ? generateHistory(mail, 'CREATE')
    : generateHistory(mail, 'UPDATE', parsedInput.CREATED_AT);

  // base KPI
  const kpiInput = {
    ...others,
    ...history,
    COMPANY_ID: input.COMPANY_ID,
    MODULE: modul,
    ASSESSMENT_YEAR: 1000,
  };

  // kpi sign
  const signKPIInput = {
    BUS_OWNER_NAME,
    BUS_OWNER_DATE,
    BUS_OWNER,
    BUS_COACH_NAME,
    BUS_COACH_DATE,
    BUS_COACH,
    CHECKER_NAME,
    CHECKER_DATE,
    CHECKER,
    COMPANY_ID: input.COMPANY_ID,
    MODULE: modul,
    ASSESSMENT_YEAR: 1000,
    GETX_TYPE: 'KPI',
    ...history,
  };

  // achievement sign
  const signActualInput = {
    BUS_OWNER_NAME: BUS_OWNER_ACTUAL_NAME,
    BUS_OWNER_DATE: BUS_OWNER_ACTUAL_DATE,
    BUS_OWNER: BUS_OWNER_ACTUAL,
    BUS_COACH_NAME: BUS_COACH_ACTUAL_NAME,
    BUS_COACH_DATE: BUS_COACH_ACTUAL_DATE,
    BUS_COACH: BUS_COACH_ACTUAL,
    CHECKER_NAME: CHECKER_ACTUAL_NAME,
    CHECKER_DATE: CHECKER_ACTUAL_DATE,
    CHECKER: CHECKER_ACTUAL,
    COMPANY_ID: input.COMPANY_ID,
    MODULE: modul,
    ASSESSMENT_YEAR: 1000,
    GETX_TYPE: 'ACHIEVEMENT',
    ...history,
  };

  // attachment
  const attachmentInput = {
    TURNOVER_ATTACHMENT: JSON.stringify(TURNOVER_ATTACHMENT),
    PROFITABILITY_ATTACHMENT: JSON.stringify(PROFITABILITY_ATTACHMENT),
    SKILLED_ATTACHMENT: JSON.stringify(SKILLED_ATTACHMENT),
    UNSKILLED_ATTACHMENT: JSON.stringify(UNSKILLED_ATTACHMENT),
    EXPORT_REVENUE_ATTACHMENT: JSON.stringify(EXPORT_REVENUE_ATTACHMENT),
    DIVERSIFY_ATTACHMENT: JSON.stringify(DIVERSIFY_ATTACHMENT),
    TECHNOLOGY_ATTACHMENT: JSON.stringify(TECHNOLOGY_ATTACHMENT),
    NG_ATTACHMENT: JSON.stringify(NG_ATTACHMENT),
    FILE_ATTACHMENT: JSON.stringify(FILE_ATTACHMENT),
    COMPANY_ID: input.COMPANY_ID,
    MODULE: modul,
    ASSESSMENT_YEAR: 1000,
    GETX_TYPE: 'ACHIEVEMENT',
    ...history,
  };

  return {
    kpiInput,
    signKPIInput,
    signActualInput,
    attachmentInput,
    SIGN_KPI_ID,
    SIGN_ACTUAL_ID,
    ATTACHMENT_ID,
  };
};

/**
 * Destructure invidiual KPI Score to an object
 * @param {Object} data data containing scpres
 * @param {string} type KPI factor
 * @returns {Object} KPI Score object
 */
const getKPIscores = (data, type) => {
  const QUARTERS = Object.keys(data)
    .filter((v1) => v1.startsWith(type))
    .filter((v2) => v2.includes('Q'))
    .map((v3) => ({
      stage: v3.replace(type, ''),
      value: data[v3],
    }));

  const CURRENT = data[`${type}CURRENT`];
  const TARGET = data[`${type}TARGET`];
  const ACHIEVEMENT = data[`${type}ACHIEVEMENT`];
  const PERCENT = data[`${type}PERCENT`];
  const FOCUS = data[`${type}FOCUS`];
  const COMMENT = data[`${type}COMMENT`];

  return {
    CURRENT,
    TARGET,
    ACHIEVEMENT,
    PERCENT,
    FOCUS,
    COMMENT,
    QUARTERS,
  };
};

/**
 * Determine the point for a KPI factor
 * @param {Object} data data containing scores
 * @param {string} type KPI factor
 * @returns {number} 1 point for >=100, 0 for vice versa
 */
const getKPIPoint = (data, type) => {
  if (type === 'TECHNOLOGY' || type === 'DIVERSIFY' || type === 'NG') {
    return parseInt(data[`${type}_PERCENT`], 10) >= 100 ? 1 : 0;
  }
  return (
    (parseInt(data[`${type}_ACHIEVEMENT`], 10) >= parseInt(data[`${type}_CURRENT`], 10))
    && (parseInt(data[`${type}_ACHIEVEMENT`], 10) !== 0))
    ? 1 : 0;
};

/**
 * Calculate and generate total points based on KPI points
 * @param {*} data main data
 * @param {Boolean} [totalOnly=false] flag to determine return only total point or the whole data
 * @returns {Object|number} whole data or only total points
 */
const getKPITotalPoint = (data, totalOnly = false) => {
  const SKILLED = getKPIPoint(data, 'SKILLED');
  const UNSKILLED = getKPIPoint(data, 'UNSKILLED');
  const DIVERSIFY = getKPIPoint(data, 'DIVERSIFY');
  const EXPORT_REVENUE = getKPIPoint(data, 'EXPORT_REVENUE');
  const TURNOVER = getKPIPoint(data, 'TURNOVER');
  const PROFITABILITY = getKPIPoint(data, 'PROFITABILITY');
  const TECHNOLOGY = getKPIPoint(data, 'TECHNOLOGY');
  const NG = getKPIPoint(data, 'NG');

  const points = {
    TURNOVER,
    PROFITABILITY,
    EMPLOYMENT: (SKILLED + UNSKILLED >= 1) ? 1 : 0,
    EXPORT: (DIVERSIFY + EXPORT_REVENUE >= 1) ? 1 : 0,
    TECHNOLOGY,
    NG,
  };

  const totalPoints = Object.values(points).reduce((acc, v) => acc + v);
  if (totalOnly) return totalPoints;

  return {
    ...points,
    KPI_TOTAL: totalPoints,
    TOTAL_G: TURNOVER + PROFITABILITY,
    TOTAL_ETXNG: points.EMPLOYMENT + points.EXPORT + TECHNOLOGY + NG,
  };
};

module.exports = {
  Query: {
    /**
     * Get data for dashboard (aggregated)
     */
    dashboardKPI: isAuthenticatedResolver.createResolver(async (
      parent, param, {
        connectors: { MysqlGetxKPI, MysqlSlvUser },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`dashboardKPI --> by ${mail} called with no input`);

      if (!checkPermission('GETX-READ', userRoleList)) {
        logger.error('dashboardKPI --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('dashboardKPI --> Permission check passed');

      // user list
      const searchOptsUser = {
        where: null,
        order: [['USER']],
      };
      const resUser = await MysqlSlvUser.findAll(searchOptsUser);
      const resultUser = resUser.map((x) => x.dataValues.USER);
      logger.debug(`dashboardKPI --> User found: ${JSON.stringify(resultUser)}`);

      // all KPI
      const searchOptsKPI = { where: null };
      const resKPI = await MysqlGetxKPI.findAll(searchOptsKPI);
      const resultKPI = resKPI.map((x) => x.dataValues);
      logger.debug(`dashboardKPI --> Total KPI found: ${resultKPI.length}`);

      const result1 = resultUser.map((u) => {
        const userKPI = resultKPI.filter((k) => k.CREATED_BY === u);
        const USER = u.includes('@') ? u.substring(0, u.lastIndexOf('@')) : u;
        if (userKPI.length === 0) {
          return {
            USER,
            TURNOVER: 0,
            PROFITABILITY: 0,
            EMPLOYMENT: 0,
            EXPORT: 0,
            TECHNOLOGY: 0,
            NG: 0,
            KPI_TOTAL: 0,
            TOTAL_G: 0,
            TOTAL_ETXNG: 0,
            ASSESSMENT_YEAR: 1000,
          };
        }
        const resUserKPI = userKPI.map((uk) => {
          const KPI_POINTS = getKPITotalPoint(uk, false);
          return {
            USER,
            ...KPI_POINTS,
            ASSESSMENT_YEAR: uk.ASSESSMENT_YEAR,
          };
        });

        return resUserKPI;
      });

      const result2 = flatten(result1);

      logger.debug(`dashboardKPI --> output: ${JSON.stringify(result2)}`);
      logger.info(`dashboardKPI --> by ${mail} completed`);

      return result2;
    }),
    /**
     * Get data for score card (individual)
     */
    scorecardKPI: isAuthenticatedResolver.createResolver(async (
      parent, { COMPANY_ID }, {
        connectors: { MysqlGetxKPI, MysqlSlvMSIC, MysqlSlvCompanyProfile },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`scorecardKPI --> by ${mail} input: ${COMPANY_ID}`);

      if (!checkPermission('GETX-READ', userRoleList)) {
        logger.error('scorecardKPI --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('scorecardKPI --> Permission check passed');

      let resultKPI = [];
      const searchOpts = { where: { COMPANY_ID } };

      // KPI
      const resKPI = await MysqlGetxKPI.findAll(searchOpts);
      logger.debug(`scorecardKPI --> total KPI found: ${resKPI.length}`);

      // Company + MSIC
      const resCompany = await MysqlSlvCompanyProfile.findById(COMPANY_ID);
      const resultCompany = {
        ...resCompany.dataValues,
        LOGO: JSON.parse(resCompany.dataValues.LOGO),
      };
      logger.debug(`scorecardKPI --> total company found: ${resCompany.length}`);

      const searchOpts2 = { where: { MSIC: resultCompany.MSIC } };
      const resMSIC = await MysqlSlvMSIC.findOne(searchOpts2);
      const resultMSIC = resMSIC.dataValues;
      logger.debug(`scorecardKPI --> total MSIC found: ${resultMSIC.length}`);

      if (resKPI.length !== 0) {
        resultKPI = resKPI.map((k) => {
          const resTemp = k.dataValues;
          const TURNOVER = getKPIscores(resTemp, 'TURNOVER_');
          const PROFITABILITY = getKPIscores(resTemp, 'PROFITABILITY_');
          const SKILLED = getKPIscores(resTemp, 'SKILLED_');
          const UNSKILLED = getKPIscores(resTemp, 'UNSKILLED_');
          const DIVERSIFY = getKPIscores(resTemp, 'DIVERSIFY_');
          const TECHNOLOGY = getKPIscores(resTemp, 'TECHNOLOGY_');
          const NG = getKPIscores(resTemp, 'NG_');
          const EXPORT_REVENUE = getKPIscores(resTemp, 'EXPORT_REVENUE_');

          // calculate KPI points
          const KPI_POINTS = getKPITotalPoint(resTemp);

          return {
            TURNOVER,
            PROFITABILITY,
            SKILLED,
            UNSKILLED,
            DIVERSIFY,
            TECHNOLOGY,
            NG,
            EXPORT_REVENUE,
            KPI_POINTS,
            ASSESSMENT_YEAR: resTemp.ASSESSMENT_YEAR,
            CREATED_BY: resTemp.CREATED_BY,
            CREATED_AT: resTemp.CREATED_AT,
            UPDATED_BY: resTemp.UPDATED_BY,
            UPDATED_AT: resTemp.UPDATED_AT,
          };
        });
      }
      logger.debug(`scorecardKPI --> KPI result: ${JSON.stringify(resKPI)}`);

      const finalResult = {
        company: resultCompany,
        msicDetails: resultMSIC,
        KPIGroup: resultKPI,
      };
      logger.debug(`scorecardKPI --> output: ${JSON.stringify(finalResult)}`);
      logger.info(`scorecardKPI --> by ${mail} completed`);

      return finalResult;
    }),
    /**
     * Retrieve one by ID
     * @param {Object} param0 main input object
     * @param {String} param0.id id
     */
    allGetXKPI: isAuthenticatedResolver.createResolver(async (
      parent, { COMPANY_ID }, {
        connectors: {
          MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment,
          MysqlSlvELSAScorecard, MysqlSlvAssessment, MysqlSlvSurvey,
        },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`allGetXKPI --> by ${mail} input: ${COMPANY_ID}`);

      if (!checkPermission('GETX-READ', userRoleList)) {
        logger.error('allGetXKPI --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('allGetXKPI --> Permission check passed');

      let result = [];
      let newResult = [];
      const searchOpts = { where: { COMPANY_ID } };

      // KPI
      const resKPI = await MysqlGetxKPI.findAll(searchOpts);
      logger.debug(`allGetXKPI --> KPI found: ${JSON.stringify(resKPI)}`);

      const resSign = await MysqlGetxSign.findAll(searchOpts);
      logger.debug(`allGetXKPI --> KPI Signature found: ${JSON.stringify(resSign)}`);

      const resAttachment = await MysqlGetxAttachment.findAll(searchOpts);
      logger.debug(`allGetXKPI --> KPI Attachment found: ${JSON.stringify(resAttachment)}`);

      // Elsa
      const resElsa = await MysqlSlvELSAScorecard.findAll(searchOpts);
      logger.debug(`allGetXKPI --> ELSA scorecard found: ${JSON.stringify(resElsa)}`);

      // Assessment
      const resScore = await MysqlSlvAssessment.findAll(searchOpts);
      logger.debug(`allGetXKPI --> Assessment found: ${JSON.stringify(resScore)}`);

      // Survey
      const resQuest = await MysqlSlvSurvey.findAll(searchOpts);
      logger.debug(`allGetXKPI --> Survey found: ${JSON.stringify(resQuest)}`);

      if (resKPI.length !== 0) {
        logger.debug(`allGetXKPI --> total KPI found: ${resKPI.length}`);
        result = resKPI.map((kpi) => {
          const result2 = kpi.dataValues;
          let resSignKPI2 = {};
          let resSignActual2 = {};
          let resAttachment3 = {};

          // sign
          const resSignKPI = resSign
            .map((k1) => k1.dataValues)
            .filter((k2) => k2.GETX_ID === result2.ID
            && k2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR)
            .filter((k3) => k3.GETX_TYPE === 'KPI');
          logger.debug(`allGetXKPI --> filtered KPI signature found: ${JSON.stringify(resSignKPI)}`);

          const resSignActual = resSign
            .map((a1) => a1.dataValues)
            .filter((a2) => a2.GETX_ID === result2.ID
            && a2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR)
            .filter((a3) => a3.GETX_TYPE === 'ACHIEVEMENT');
          logger.debug(`allGetXKPI --> filtered Achievement signature found: ${JSON.stringify(resSignActual)}`);

          // attachment
          const resAttachment2 = resAttachment
            .map((at1) => at1.dataValues)
            .filter((at2) => at2.GETX_ID === result2.ID
          && at2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR)
            .filter((at3) => at3.GETX_TYPE === 'ACHIEVEMENT');
          logger.debug(`allGetXKPI --> filtered KPI attachment found: ${JSON.stringify(resAttachment2)}`);

          // elsa
          const resElsa2 = resElsa
            .map((e1) => e1.dataValues)
            .filter((e2) => e2.COMPANY_ID === result2.COMPANY_ID
              && e2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR);
          logger.debug(`allGetXKPI --> filtered ELSA found: ${JSON.stringify(resElsa2)}`);

          // assessment
          const resScore2 = resScore
            .map((s1) => s1.dataValues)
            .filter((s2) => s2.COMPANY_ID === result2.COMPANY_ID
              && s2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR);
          logger.debug(`allGetXKPI --> filtered Assessment found: ${JSON.stringify(resScore2)}`);

          // assessment
          const resQuest2 = resQuest
            .map((q1) => q1.dataValues)
            .filter((q2) => q2.COMPANY_ID === result2.COMPANY_ID
              && q2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR);
          logger.debug(`allGetXKPI --> filtered Survey found: ${JSON.stringify(resQuest2)}`);

          // kpi
          if (resSignKPI.length !== 0) {
            logger.debug(`allGetXKPI --> total KPI Signature found: ${resSignKPI.length}`);

            const { ID, ...others } = resSignKPI[0];
            resSignKPI2 = {
              ...others,
              SIGN_KPI_ID: ID,
            };
          }
          // achievement
          if (resSignActual.length !== 0) {
            logger.debug(`allGetXKPI --> total Achievement Signature found: ${resSignActual.length}`);

            const { ID, ...others } = resSignActual[0];
            resSignActual2 = {
              SIGN_ACTUAL_ID: ID,
              BUS_OWNER_ACTUAL_NAME: others.BUS_OWNER_NAME,
              BUS_OWNER_ACTUAL_DATE: others.BUS_OWNER_DATE,
              BUS_OWNER_ACTUAL: others.BUS_OWNER,
              BUS_COACH_ACTUAL_NAME: others.BUS_COACH_NAME,
              BUS_COACH_ACTUAL_DATE: others.BUS_COACH_DATE,
              BUS_COACH_ACTUAL: others.BUS_COACH,
              CHECKER_ACTUAL_NAME: others.CHECKER_NAME,
              CHECKER_ACTUAL_DATE: others.CHECKER_DATE,
              CHECKER_ACTUAL: others.CHECKER,
            };
          }

          // attachment
          if (resAttachment2.length !== 0) {
            logger.debug(`allGetXKPI --> total KPI Attachment found: ${resAttachment2.length}`);

            const { ID, ...others } = resAttachment2[0];
            resAttachment3 = {
              ATTACHMENT_ID: ID,
              TURNOVER_ATTACHMENT: JSON.parse(others.TURNOVER_ATTACHMENT),
              PROFITABILITY_ATTACHMENT: JSON.parse(others.PROFITABILITY_ATTACHMENT),
              SKILLED_ATTACHMENT: JSON.parse(others.SKILLED_ATTACHMENT),
              UNSKILLED_ATTACHMENT: JSON.parse(others.UNSKILLED_ATTACHMENT),
              EXPORT_REVENUE_ATTACHMENT: JSON.parse(others.EXPORT_REVENUE_ATTACHMENT),
              DIVERSIFY_ATTACHMENT: JSON.parse(others.DIVERSIFY_ATTACHMENT),
              TECHNOLOGY_ATTACHMENT: JSON.parse(others.TECHNOLOGY_ATTACHMENT),
              NG_ATTACHMENT: JSON.parse(others.NG_ATTACHMENT),
              FILE_ATTACHMENT: JSON.parse(others.FILE_ATTACHMENT),
            };
          }

          // calculate ELSA total score
          const totalFinalScore = getTotalScore(resElsa2);

          newResult = {
            KPI: {
              ...resSignKPI2,
              ...resSignActual2,
              ...resAttachment3,
              ...result2,
            },
            ELSA: resElsa2,
            assessment: resScore2[0],
            TOTAL_FINAL_SCORE: totalFinalScore,
            ASSESSMENT_YEAR: result2.ASSESSMENT_YEAR,
            SME_CLASS: resQuest2[0].SME_CLASS,
          };

          return newResult;
        });
      } else {
        // elsa
        const resElsa4 = resElsa.length === 0
          ? []
          : resElsa
            .map((e1) => e1.dataValues)
            .filter((e2) => e2.COMPANY_ID === COMPANY_ID
              && e2.ASSESSMENT_YEAR === 1000);

        // assessment
        const resScore4 = resScore.length === 0
          ? [{}]
          : resScore
            .map((s1) => s1.dataValues)
            .filter((s2) => s2.COMPANY_ID === COMPANY_ID
              && s2.ASSESSMENT_YEAR === 1000);

        // survey
        const resQuest4 = resQuest.length === 0
          ? [{}]
          : resQuest
            .map((q1) => q1.dataValues)
            .filter((q2) => q2.COMPANY_ID === COMPANY_ID
              && q2.ASSESSMENT_YEAR === 1000);

        // calculate total score
        const totalFinalScore2 = resElsa4.length === 0 ? 0 : getTotalScore(resElsa4);

        newResult = {
          KPI: {},
          ELSA: resElsa4,
          assessment: resScore4[0],
          TOTAL_FINAL_SCORE: totalFinalScore2,
          ASSESSMENT_YEAR: resScore4[0].ASSESSMENT_YEAR,
          SME_CLASS: resQuest4[0].SME_CLASS,
        };
        // console.log(newResult);

        logger.debug(`allGetXKPI --> output: ${JSON.stringify(newResult)}`);
        logger.info(`allGetXKPI --> by ${mail} completed`);

        return [newResult];
      }
      return result;
    }),
  },
  Mutation: {
    createGetXKPI: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`createGetXKPI --> by ${mail} input: ${input.COMPANY_ID}`);
      logger.debug(`createGetXKPI --> input: ${JSON.stringify(input)}`);

      if (!checkPermission('GETX-CREATE', userRoleList)) {
        logger.error('createGetXKPI --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('createGetXKPI --> Permission check passed');

      // process input
      const {
        kpiInput, signKPIInput, signActualInput, attachmentInput,
      } = processGetxData(input, mail, userRoleList.MODULE);

      // main KPI
      const getXKPIInput = {
        ...kpiInput,
        ID: generateId(),
      };
      const resultKPI = await MysqlGetxKPI.create(getXKPIInput);
      logger.debug(`createGetXKPI --> KPI created: ${JSON.stringify(resultKPI)}`);

      // KPI sign
      const getXSignKPIInput = {
        ...signKPIInput,
        ID: generateId(),
        GETX_ID: getXKPIInput.ID,
      };
      const resultKPISign = await MysqlGetxSign.create(getXSignKPIInput);
      logger.debug(`createGetXKPI --> KPI signature created: ${JSON.stringify(resultKPISign)}`);

      // Actual KPI Sign
      const getXSignActualInput = {
        ...signActualInput,
        ID: generateId(),
        GETX_ID: getXKPIInput.ID,
      };
      const resultKPIActual = await MysqlGetxSign.create(getXSignActualInput);
      logger.debug(`createGetXKPI --> Achievement created: ${JSON.stringify(resultKPIActual)}`);

      // Attachment
      const getXAttachmentInput = {
        ...attachmentInput,
        ID: generateId(),
        GETX_ID: getXKPIInput.ID,
      };
      const resultKPIAttachment = await MysqlGetxAttachment.create(getXAttachmentInput);
      logger.debug(`createGetXKPI --> Attachment created: ${JSON.stringify(resultKPIAttachment)}`);

      logger.debug(`createGetXKPI --> output: ${JSON.stringify(resultKPI)}`);
      logger.info(`createGetXKPI --> by ${mail} completed`);

      return resultKPI;
    }),

    updateGetXKPI: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`updateGetXKPI --> by ${mail} input: ${input.COMPANY_ID}`);
      logger.debug(`updateGetXKPI --> input: ${JSON.stringify(input)}`);

      if (!checkPermission('GETX-UPDATE', userRoleList)) {
        logger.error('updateGetXKPI --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('updateGetXKPI --> Permission check passed');

      // process input
      const {
        kpiInput, signKPIInput, signActualInput, attachmentInput,
        SIGN_KPI_ID, SIGN_ACTUAL_ID, ATTACHMENT_ID,
      } = processGetxData(input, mail, userRoleList.MODULE, false);

      const createHistory = generateHistory(mail, 'CREATE');

      // KPI
      const searchOptsKPI = {
        object: kpiInput,
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
        },
      };
      const resultKPI = await MysqlGetxKPI.update(searchOptsKPI);
      logger.debug(`updateGetXKPI --> KPI updated: ${JSON.stringify(resultKPI)}`);

      // Sign
      if (SIGN_KPI_ID) {
        const searchOptsSignKPI = {
          object: {
            ...signKPIInput,
            ID: SIGN_KPI_ID,
            GETX_ID: kpiInput.ID,
          },
          where: {
            COMPANY_ID: input.COMPANY_ID,
            ASSESSMENT_YEAR: 1000,
            ID: SIGN_KPI_ID,
          },
        };
        const resultKPISignU = await MysqlGetxSign.update(searchOptsSignKPI);
        logger.debug(`updateGetXKPI --> KPI signature updated: ${JSON.stringify(resultKPISignU)}`);
      } else {
        const getXSignKPIInput = {
          ...signKPIInput,
          ...createHistory,
          ID: generateId(),
          GETX_ID: kpiInput.ID,
        };
        const resultKPISignC = await MysqlGetxSign.create(getXSignKPIInput);
        logger.debug(`updateGetXKPI --> KPI signature created: ${JSON.stringify(resultKPISignC)}`);
      }

      // Achievement
      if (SIGN_ACTUAL_ID) {
        const searchOptsSignActual = {
          object: {
            ...signActualInput,
            ID: SIGN_ACTUAL_ID,
            GETX_ID: kpiInput.ID,
          },
          where: {
            COMPANY_ID: input.COMPANY_ID,
            ASSESSMENT_YEAR: 1000,
            ID: SIGN_ACTUAL_ID,
          },
        };
        const resultKPISignActualU = await MysqlGetxSign.update(searchOptsSignActual);
        logger.debug(`updateGetXKPI --> Achievement signature updated: ${JSON.stringify(resultKPISignActualU)}`);
      } else {
        const getXSignActualInput = {
          ...signActualInput,
          ...createHistory,
          ID: generateId(),
          GETX_ID: kpiInput.ID,
        };
        const resultKPISignActualC = await MysqlGetxSign.create(getXSignActualInput);
        logger.debug(`updateGetXKPI --> Achievement signature created: ${JSON.stringify(resultKPISignActualC)}`);
      }

      // attachment
      if (ATTACHMENT_ID) {
        const searchOptsAttachment = {
          object: {
            ...attachmentInput,
            ID: ATTACHMENT_ID,
            GETX_ID: kpiInput.ID,
          },
          where: {
            COMPANY_ID: input.COMPANY_ID,
            ASSESSMENT_YEAR: 1000,
            ID: ATTACHMENT_ID,
          },
        };
        const resultKPIAttachmentU = await MysqlGetxAttachment.update(searchOptsAttachment);
        logger.debug(`updateGetXKPI --> KPI Attachment updated: ${JSON.stringify(resultKPIAttachmentU)}`);
      } else {
        const getXAttachmentInput = {
          ...attachmentInput,
          ...createHistory,
          ID: generateId(),
          GETX_ID: kpiInput.ID,
        };
        const resultKPIAttachmentC = await MysqlGetxAttachment.create(getXAttachmentInput);
        logger.debug(`updateGetXKPI --> KPI Attachment created: ${JSON.stringify(resultKPIAttachmentC)}`);
      }

      // result
      const result2 = {
        ID: input.COMPANY_ID,
        updated: resultKPI[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      logger.debug(`updateGetXKPI --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateGetXKPI --> by ${mail} completed`);

      return result2;
    }),
    finalizeKPI: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`finalizeKPI --> by ${mail} input: ${input.COMPANY_ID}`);
      logger.debug(`finalizeKPI --> input: ${JSON.stringify(input)}`);

      if (!checkPermission('GETX-CREATE', userRoleList)) {
        logger.error('finalizeKPI --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('finalizeKPI --> Permission check passed');

      // kpi
      const searchOptsKPI = { where: { COMPANY_ID: input.COMPANY_ID } };

      const resKPI = await MysqlGetxKPI.findOne(searchOptsKPI);
      const KPIInput = resKPI.dataValues;

      const KPIHist = generateHistory(mail, 'CREATE');
      const finalKPI = {
        ...KPIInput,
        ...KPIHist,
        KPI_DATE: moment(KPIInput.KPI_DATE, 'x').add(-8, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        ID: generateId(),
      };
      const resFinalKPI = await MysqlGetxKPI.create(finalKPI);
      logger.debug(`finalizeKPI --> KPI created: ${JSON.stringify(resFinalKPI)}`);

      // attachment
      const searchOptsAtt = { where: { COMPANY_ID: input.COMPANY_ID } };

      const resAtt = await MysqlGetxAttachment.findOne(searchOptsAtt);
      const attInput = resAtt.dataValues;

      const attHist = generateHistory(mail, 'CREATE');
      const finalAtt = {
        ...attInput,
        ...attHist,
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        ID: generateId(),
        GETX_ID: finalKPI.ID,
      };
      const resFinalKPIAttachment = await MysqlGetxAttachment.create(finalAtt);
      logger.debug(`finalizeKPI --> KPI attachment created: ${JSON.stringify(resFinalKPIAttachment)}`);

      // scorecard
      const searchOptsSign = {
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
        },
      };

      const resSign = await MysqlGetxSign.findAll(searchOptsSign);
      const signInput = resSign.map((b) => {
        const preSign = b.dataValues;
        const history = generateHistory(mail, 'CREATE');
        const newSign = {
          ...preSign,
          ...history,
          // BUS_COACH_DATE: preSign.BUS_COACH_DATE.toISOString(),
          // BUS_OWNER_DATE: preSign.BUS_OWNER_DATE.toISOString(),
          // CHECKER_DATE: preSign.CHECKER_DATE.toISOString(),
          ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
          COMPANY_ID: input.COMPANY_ID,
          ID: generateId(),
          GETX_ID: finalKPI.ID,
        };
        return newSign;
      });
      const resFinalKPISign = await MysqlGetxSign.bulkCreate(signInput);
      logger.debug(`finalizeKPI --> KPI Signature created: ${JSON.stringify(resFinalKPISign)}`);

      logger.debug(`finalizeKPI --> output: ${JSON.stringify(input)}`);
      logger.info(`finalizeKPI --> by ${mail} completed`);

      return input;
    }),
  },
};
