// const moment = require('moment');
const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { checkPermission } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const logger = require('../../../packages/logger');
const { allGetXCoachLogRule, updateGetXCoachRule } = require('../../permissions/rule');

/**
 * Convert specific quarter data to generic. Also to extract target data
 * @param {Object} data data
 * @param {number} quarter quarter
 * @param {boolean} [actual=false] flag for target data
 * @returns {Object} processed data
 */
const getSimplifiedGetx = (data, quarter, target = false) => {
  const filter = target ? '_TARGET' : quarter;

  return Object.keys(data)
    .filter((key) => key.includes(filter))
    .reduce((obj, key) => Object.assign(obj, {
      [key]: data[key],
    }), {});
};

const processGetxCoachData = (input, mail) => {
  const parsedInput = JSON.parse(input.data);

  // separate KPI and achievement fields
  const {
    MODULE,
    GETX_ID,
    // coach log
    ID,
    CLIENT_EXPECTATION,
    CLIENT_ISSUES,
    DIVERSIFY_GAP,
    END_COACH,
    EXPORT_REVENUE_GAP,
    FURTHER_NOTES_COACHING,
    PROFITABILITY_GAP,
    SKILLED_GAP,
    START_COACH,
    TECHNOLOGY_GAP,
    TURNOVER_GAP,
    UNSKILLED_GAP,
    NG_GAP,
    VENUE,
    ACTION_PLANS,
    COACHING_SESSION,
    QUARTER,
    // kpi sign
    BUS_OWNER_NAME,
    BUS_OWNER_DATE,
    BUS_OWNER,
    BUS_COACH_NAME,
    BUS_COACH_DATE,
    BUS_COACH,
    CHECKER_NAME,
    CHECKER_DATE,
    CHECKER,
    SIGN_ID,
    // attachment
    FILE_ATTACHMENT,
    ATTACHMENT_ID,
  } = parsedInput;

  // generate created updated fields
  const historyCreate = generateHistory(mail, 'CREATE');
  const historyUpdate = generateHistory(mail, 'UPDATE', parsedInput.CREATED_AT);

  const achievementInput = getSimplifiedGetx(parsedInput, QUARTER, false);

  const coachInput = {
    ID,
    GETX_ID,
    CLIENT_EXPECTATION,
    CLIENT_ISSUES,
    DIVERSIFY_GAP,
    END_COACH,
    EXPORT_REVENUE_GAP,
    FURTHER_NOTES_COACHING,
    PROFITABILITY_GAP,
    SKILLED_GAP,
    START_COACH,
    TECHNOLOGY_GAP,
    TURNOVER_GAP,
    UNSKILLED_GAP,
    NG_GAP,
    VENUE,
    ACTION_PLANS: JSON.stringify(ACTION_PLANS),
    COACHING_SESSION,
    QUARTER,
    COMPANY_ID: input.COMPANY_ID,
    MODULE: JSON.stringify(MODULE),
    ASSESSMENT_YEAR: 1000,
  };

  const kpiAchievementInput = {
    ...achievementInput,
    ...historyUpdate,
    COMPANY_ID: input.COMPANY_ID,
    MODULE: JSON.stringify(MODULE),
    ASSESSMENT_YEAR: 1000,
  };

  // coach sign
  const signCoachInput = {
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
    MODULE: JSON.stringify(MODULE),
    ASSESSMENT_YEAR: 1000,
    GETX_TYPE: `COACH_Q${QUARTER}`,
    GETX_ID,
  };

  // attachment
  const attachmentInput = {
    FILE_ATTACHMENT: JSON.stringify(FILE_ATTACHMENT),
    COMPANY_ID: input.COMPANY_ID,
    MODULE: JSON.stringify(MODULE),
    ASSESSMENT_YEAR: 1000,
    GETX_TYPE: `COACH_Q${QUARTER}`,
    GETX_ID,
  };

  return {
    coachInput,
    kpiAchievementInput,
    signCoachInput,
    attachmentInput,
    SIGN_ID,
    ATTACHMENT_ID,
    QUARTER,
    historyCreate,
    historyUpdate,
    ID,
  };
};

module.exports = {
  Query: {
    /**
     * Retrieve one by ID
     * @param {Object} param0 main input object
     * @param {String} param0.id id
     */
    allGetXCoachLog: isAuthenticatedResolver.createResolver(
      async (parent, { COMPANY_ID, QUARTER }, {
        connectors: {
          MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment, MysqlGetxAchievement,
          MysqlSlvCompanyProfile, MysqlGetxCoachLog,
        },
        user: { mail, userRoleList, userType },
      }) => {
        logger.info(`allGetXCoachLog --> by ${mail} input: ${COMPANY_ID}`);
        checkPermission(allGetXCoachLogRule, userRoleList, userType, 'allGetXCoachLog');

        let result = [];
        let newResult = [];
        const searchOpts = { where: { COMPANY_ID } };
        const searchOptsQuarter = { where: { COMPANY_ID, GETX_TYPE: `COACH_Q${QUARTER}` } };
        const searchOptsQuarterNum = { where: { COMPANY_ID, QUARTER } };
        const searchOptsCompany = { where: { ID: COMPANY_ID } };

        // KPI
        const resKPI = await MysqlGetxKPI.findAll(searchOpts);
        logger.debug(`allGetXCoachLog --> KPI found: ${resKPI.length}`);

        const resKPIAchievement = await MysqlGetxAchievement.findAll(searchOpts);
        logger.debug(`allGetXCoachLog --> KPI Achievement found: ${resKPIAchievement.length}`);

        const resSign = await MysqlGetxSign.findAll(searchOpts);
        logger.debug(`allGetXCoachLog --> KPI Signature found: ${resSign.length}`);

        const resAttachment = await MysqlGetxAttachment.findAll(searchOptsQuarter);
        logger.debug(`allGetXCoachLog --> KPI Attachment found: ${resAttachment.length}`);

        const resCoachLog = await MysqlGetxCoachLog.findAll(searchOptsQuarterNum);
        logger.debug(`allGetXCoachLog --> Coach Log found: ${resCoachLog.length}`);

        const resCompany = await MysqlSlvCompanyProfile.findOne(searchOptsCompany);
        logger.debug(`allGetXCoachLog --> Company found: ${JSON.stringify(resCompany)}`);
        const resultCompany = resCompany.dataValues;

        if (resKPI.length !== 0) {
          result = resKPI.map((kpi) => {
            const resTemp = kpi.dataValues;

            let resAchievement = {};
            let resultCoachLog = {};
            let resultSignCoach = {};
            let resultAttachmentCoach = {};

            // achievement
            if (resKPIAchievement.length !== 0) {
              [resAchievement] = resKPIAchievement
                .map((k1) => k1.dataValues)
                .filter((k2) => k2.GETX_ID === kpi.ID
              && k2.ASSESSMENT_YEAR === kpi.ASSESSMENT_YEAR);
            }

            // coachLog
            if (resCoachLog.length !== 0) {
              const [resCoachLog2] = resCoachLog
                .map((c1) => c1.dataValues)
                .filter((c2) => c2.GETX_ID === kpi.ID
                && c2.ASSESSMENT_YEAR === kpi.ASSESSMENT_YEAR);

              if (resCoachLog2) {
                resultCoachLog = {
                  ...resCoachLog2,
                  ACTION_PLANS: JSON.parse(resCoachLog2.ACTION_PLANS),
                };
              }
            }

            const resultAchievement = getSimplifiedGetx(resAchievement, QUARTER, false);
            const resultQuarter = getSimplifiedGetx(resTemp, QUARTER, false);
            const resultTarget = getSimplifiedGetx(resTemp, QUARTER, true);

            const result2 = {
              ...resultAchievement,
              ...resultQuarter,
              ...resultTarget,
              ...resultCoachLog,
              ID: resultCoachLog.ID,
              GETX_ID: resTemp.ID,
              MODULE: JSON.parse(resTemp.MODULE),
              ASSESSMENT_YEAR: resTemp.ASSESSMENT_YEAR,
              COMPANY_ID: resTemp.COMPANY_ID,
              CREATED_AT: resTemp.CREATED_AT,
              CREATED_BY: resTemp.CREATED_BY,
              UPDATED_AT: resTemp.UPDATED_AT,
              UPDATED_BY: resTemp.UPDATED_BY,
            };

            // sign
            const resSignCoach = resSign
              .map((k1) => k1.dataValues)
              .filter((k2) => k2.GETX_ID === result2.GETX_ID
            && k2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR);
            logger.debug(`allGetXCoachLog --> filtered KPI signature found: ${resSignCoach.length}`);

            // attachment
            const resAttachmentCoach = resAttachment
              .map((at1) => at1.dataValues)
              .filter((at2) => at2.GETX_ID === result2.GETX_ID
            && at2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR);
            logger.debug(`allGetXCoachLog --> filtered KPI attachment found: ${resAttachmentCoach.length}`);

            // kpi
            if (resSignCoach.length !== 0) {
              const quarterData = resSignCoach.filter((k3) => k3.GETX_TYPE === `COACH_Q${QUARTER}`);
              const kpiData = resSignCoach.filter((k3) => k3.GETX_TYPE === 'KPI');

              if (quarterData.length !== 0) {
                const { ID, ...others } = quarterData[0];

                resultSignCoach = {
                  ...others,
                  SIGN_ID: ID,
                };
              } else {
                const {
                  BUS_COACH_NAME, BUS_OWNER_NAME, CHECKER_NAME,
                } = kpiData[0];

                resultSignCoach = {
                  BUS_COACH_NAME,
                  BUS_OWNER_NAME,
                  CHECKER_NAME,
                };
              }
            }

            // attachment
            if (resAttachmentCoach.length !== 0) {
              const { ID, ...others } = resAttachmentCoach[0];
              resultAttachmentCoach = {
                ATTACHMENT_ID: ID,
                FILE_ATTACHMENT: JSON.parse(others.FILE_ATTACHMENT),
              };
            }

            // compile
            newResult = {
              COACH: {
                ENTITY_NAME: resultCompany.ENTITY_NAME,
                ...resultSignCoach,
                ...resultAttachmentCoach,
                ...result2,
              },
              ASSESSMENT_YEAR: result2.ASSESSMENT_YEAR,
            };
            // console.dir(newResult, { depth: null });

            return newResult;
          });
        } else {
          return [];
        }
        return result;
      },
    ),
  },
  Mutation: {
    updateGetXCoachLog: isAuthenticatedResolver.createResolver(async (parent, { input }, {
      connectors: {
        MysqlGetxSign, MysqlGetxAttachment, MysqlGetxAchievement, MysqlGetxCoachLog,
      },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`updateGetXCoachLog --> by ${mail} input: ${input.COMPANY_ID}`);
      logger.debug(`updateGetXCoachLog --> input: ${JSON.stringify(input)}`);
      checkPermission(updateGetXCoachRule, userRoleList, userType, 'updateGetXCoachLog');

      // process input
      const {
        coachInput,
        kpiAchievementInput,
        signCoachInput,
        attachmentInput,
        SIGN_ID,
        ATTACHMENT_ID,
        historyCreate,
        historyUpdate,
        QUARTER,
        ID,
      } = processGetxCoachData(input, mail, false);

      let resultCoach = {};

      // Coach Log
      if (ID) {
        const searchOptsCoach = {
          object: {
            ...coachInput,
            ...historyUpdate,
          },
          where: {
            COMPANY_ID: input.COMPANY_ID,
            QUARTER,
            ASSESSMENT_YEAR: 1000,
          },
        };
        resultCoach = await MysqlGetxCoachLog.update(searchOptsCoach);
        logger.debug(`updateGetXCoachLog --> Coach Log updated: ${JSON.stringify(resultCoach)}`);
      } else {
        const getXCoachInput = {
          ...coachInput,
          ...historyCreate,
          ID: generateId(),
        };
        resultCoach = await MysqlGetxCoachLog.create(getXCoachInput);
        logger.debug(`updateGetXCoachLog --> Coach Log created: ${JSON.stringify(resultCoach)}`);
      }

      // Achievement
      const searchOptsKPIAchievement = {
        object: kpiAchievementInput,
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
        },
      };
      const resultKPIAchievement = await MysqlGetxAchievement.update(searchOptsKPIAchievement);
      logger.debug(`updateGetXCoachLog --> KPI Achievement updated: ${JSON.stringify(resultKPIAchievement)}`);

      // Sign
      if (SIGN_ID) {
        const searchOptsSignCoach = {
          object: {
            ...signCoachInput,
            ...historyUpdate,
          },
          where: {
            COMPANY_ID: input.COMPANY_ID,
            ASSESSMENT_YEAR: 1000,
            ID: SIGN_ID,
            GETX_TYPE: `COACH_Q${QUARTER}`,
          },
        };
        const resultCoachSignU = await MysqlGetxSign.update(searchOptsSignCoach);
        logger.debug(`updateGetXCoachLog --> Coach Log signature updated: ${JSON.stringify(resultCoachSignU)}`);
      } else {
        const getXSignCoachInput = {
          ...signCoachInput,
          ...historyCreate,
          ID: generateId(),
        };
        const resultCoachSignC = await MysqlGetxSign.create(getXSignCoachInput);
        logger.debug(`updateGetXCoachLog --> Coach Log signature created: ${JSON.stringify(resultCoachSignC)}`);
      }

      // attachment
      if (ATTACHMENT_ID) {
        const searchOptsAttachment = {
          object: {
            ...attachmentInput,
            ...historyUpdate,
          },
          where: {
            COMPANY_ID: input.COMPANY_ID,
            ASSESSMENT_YEAR: 1000,
            ID: ATTACHMENT_ID,
            GETX_TYPE: `COACH_Q${QUARTER}`,
          },
        };
        const resultKPIAttachmentU = await MysqlGetxAttachment.update(searchOptsAttachment);
        logger.debug(`updateGetXCoachLog --> KPI Attachment updated: ${JSON.stringify(resultKPIAttachmentU)}`);
      } else {
        const getXAttachmentInput = {
          ...attachmentInput,
          ...historyCreate,
          ID: generateId(),
        };
        const resultKPIAttachmentC = await MysqlGetxAttachment.create(getXAttachmentInput);
        logger.debug(`updateGetXCoachLog --> KPI Attachment created: ${JSON.stringify(resultKPIAttachmentC)}`);
      }

      // result
      const result2 = {
        ID: input.COMPANY_ID,
        updated: resultCoach[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      logger.debug(`updateGetXCoachLog --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateGetXCoachLog --> by ${mail} completed`);

      return result2;
    }),
  },
};
