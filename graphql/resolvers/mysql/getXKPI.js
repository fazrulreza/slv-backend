const flatten = require('lodash/flatten');
const moment = require('moment');
const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { getTotalScore } = require('../../helper/common');
const {
  kpiElsaResolver, kpiResolver, kpiCompanyResolver, kpiUserResolver,
} = require('../../permissions/acl');

const processGetxData = (input, user) => {
  const parsedInput = JSON.parse(input.data);

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

  const history = generateHistory(user.mail, 'CREATE');

  const kpiInput = {
    ...others,
    ...history,
    COMPANY_ID: input.COMPANY_ID,
    ASSESSMENT_YEAR: 1000,
  };

  // kpi
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
    ASSESSMENT_YEAR: 1000,
    GETX_TYPE: 'KPI',
    ...history,
  };

  // achievement
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


const getKPIscores = (data, type) => {
  const QUARTERS = Object.keys(data)
    .filter(v1 => v1.startsWith(type))
    .filter(v2 => v2.includes('Q'))
    .map(v3 => ({
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

const getKPIPoint = (data, abbr) => {
  if (abbr === 'TECHNOLOGY' || abbr === 'DIVERSIFY' || abbr === 'NG') {
    return parseInt(data[`${abbr}_PERCENT`], 10) >= 100 ? 1 : 0;
  }
  return (parseInt(data[`${abbr}_ACHIEVEMENT`], 10) >= parseInt(data[`${abbr}_TARGET`], 10)) ? 1 : 0;
};

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
    dashboardKPI: kpiUserResolver.createResolver(async (
      parent,
      param,
      { connectors: { MysqlGetxKPI, MysqlSlvUserRole } },
    ) => {
      // user list
      const searchOptsUser = {
        where: null,
        order: [['USER']],
      };
      const resUser = await MysqlSlvUserRole.findAll(searchOptsUser);
      const resultUser = resUser.map(x => x.dataValues.USER);
      // .filter(x2 => x2 === 'fazrul.reza@smebank.com.my');

      // all KPI
      const searchOptsKPI = { where: null };
      const resKPI = await MysqlGetxKPI.findAll(searchOptsKPI);
      const resultKPI = resKPI.map(x => x.dataValues);

      const result1 = resultUser.map((u) => {
        const userKPI = resultKPI.filter(k => k.CREATED_BY === u);
        const USER = u.substring(0, u.lastIndexOf('@'));
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


      return result2;
    }),
    /**
     * Get data for score card (individual)
     */
    scorecardKPI: kpiCompanyResolver.createResolver(async (
      parent,
      { COMPANY_ID },
      {
        connectors: { MysqlGetxKPI, MysqlSlvMSIC, MysqlSlvCompanyProfile },
      },
    ) => {
      let resultKPI = [];
      const searchOpts = { where: { COMPANY_ID } };

      // KPI
      const resKPI = await MysqlGetxKPI.findAll(searchOpts);

      // Company + MSIC
      const resultCompany = await MysqlSlvCompanyProfile.findById(COMPANY_ID);
      const searchOpts2 = { where: { MSIC: resultCompany.MSIC } };
      const resMSIC = await MysqlSlvMSIC.findOne(searchOpts2);
      const resultMSIC = resMSIC.dataValues;

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
            UPDATED_BY: resTemp.UPDATED_BY,
            UPDATED_AT: resTemp.UPDATED_AT,
          };
        });
      }

      const finalResult = {
        company: resultCompany,
        msicDetails: resultMSIC,
        KPIGroup: resultKPI,
      };

      return finalResult;
    }),
    /**
     * Retrieve one by ID
     * @param {Object} param0 main input object
     * @param {String} param0.id id
     */
    allGetXKPI: kpiElsaResolver.createResolver(async (
      parent,
      { COMPANY_ID },
      {
        connectors: {
          MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment,
          MysqlSlvELSAScorecard, MysqlSlvAssessment,
        },
      },
    ) => {
      let result = [];
      let newResult = [];
      const searchOpts = { where: { COMPANY_ID } };

      // KPI
      const resKPI = await MysqlGetxKPI.findAll(searchOpts);
      const resSign = await MysqlGetxSign.findAll(searchOpts);
      const resAttachment = await MysqlGetxAttachment.findAll(searchOpts);

      // Elsa
      const resElsa = await MysqlSlvELSAScorecard.findAll(searchOpts);

      // Assessment
      const resScore = await MysqlSlvAssessment.findAll(searchOpts);

      if (resKPI.length !== 0) {
        result = resKPI.map((kpi) => {
          const result2 = kpi.dataValues;
          let resSignKPI2 = {};
          let resSignActual2 = {};
          let resAttachment3 = {};

          // sign
          const resSignKPI = resSign
            .map(k1 => k1.dataValues)
            .filter(k2 => k2.GETX_ID === result2.ID
            && k2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR)
            .filter(k3 => k3.GETX_TYPE === 'KPI');

          const resSignActual = resSign
            .map(a1 => a1.dataValues)
            .filter(a2 => a2.GETX_ID === result2.ID
            && a2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR)
            .filter(a3 => a3.GETX_TYPE === 'ACHIEVEMENT');

          // attachment
          const resAttachment2 = resAttachment
            .map(at1 => at1.dataValues)
            .filter(at2 => at2.GETX_ID === result2.ID
          && at2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR)
            .filter(at3 => at3.GETX_TYPE === 'ACHIEVEMENT');


          // elsa
          const resElsa2 = resElsa
            .map(e1 => e1.dataValues)
            .filter(e2 => e2.COMPANY_ID === result2.COMPANY_ID
              && e2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR);

          // assessment
          const resScore2 = resScore
            .map(s1 => s1.dataValues)
            .filter(s2 => s2.COMPANY_ID === result2.COMPANY_ID
              && s2.ASSESSMENT_YEAR === result2.ASSESSMENT_YEAR);

          // kpi
          if (resSignKPI.length !== 0) {
            const { ID, ...others } = resSignKPI[0];
            resSignKPI2 = {
              ...others,
              SIGN_KPI_ID: ID,
            };
          }
          // achievement
          if (resSignActual.length !== 0) {
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
              ...result2,
              ...resSignKPI2,
              ...resSignActual2,
              ...resAttachment3,
            },
            ELSA: resElsa2,
            assessment: resScore2[0],
            TOTAL_FINAL_SCORE: totalFinalScore,
            ASSESSMENT_YEAR: result2.ASSESSMENT_YEAR,
          };

          return newResult;
        });
      } else {
        console.log('no kpi');
        console.log(resElsa.length);
        console.log(resScore.length);
        // elsa
        const resElsa4 = resElsa.length === 0
          ? []
          : resElsa
            .map(e1 => e1.dataValues)
            .filter(e2 => e2.COMPANY_ID === COMPANY_ID
            && e2.ASSESSMENT_YEAR === 1000);

        // assessment
        const resScore4 = resScore.length === 0
          ? [{}]
          : resScore
            .map(s1 => s1.dataValues)
            .filter(s2 => s2.COMPANY_ID === COMPANY_ID
            && s2.ASSESSMENT_YEAR === 1000);

        // calculate total score
        const totalFinalScore2 = resElsa4.length === 0 ? 0 : getTotalScore(resElsa4);

        newResult = {
          KPI: {},
          ELSA: resElsa4,
          assessment: resScore4[0],
          TOTAL_FINAL_SCORE: totalFinalScore2,
          ASSESSMENT_YEAR: resScore4[0].ASSESSMENT_YEAR,
        };
        // console.log(newResult);

        return [newResult];
      }
      return result;
    }),
  },
  Mutation: {
    createGetXKPI: kpiResolver.createResolver(async (
      parent,
      { input },
      { connectors: { MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment }, user }) => {
      // process input
      const {
        kpiInput, signKPIInput, signActualInput, attachmentInput,
      } = processGetxData(input, user);

      // main KPI
      const getXKPIInput = {
        ...kpiInput,
        ID: generateId(),
      };
      const resultKPI = await MysqlGetxKPI.create(getXKPIInput);

      // KPI sign
      const getXSignKPIInput = {
        ...signKPIInput,
        ID: generateId(),
        GETX_ID: getXKPIInput.ID,
      };
      await MysqlGetxSign.create(getXSignKPIInput);

      // Actual KPI Sign
      const getXSignActualInput = {
        ...signActualInput,
        ID: generateId(),
        GETX_ID: getXKPIInput.ID,
      };
      await MysqlGetxSign.create(getXSignActualInput);

      // Attachment
      const getXAttachmentInput = {
        ...attachmentInput,
        ID: generateId(),
        GETX_ID: getXKPIInput.ID,
      };
      await MysqlGetxAttachment.create(getXAttachmentInput);

      return resultKPI;
    }),

    updateGetXKPI: kpiResolver.createResolver(async (
      parent,
      { input },
      { connectors: { MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment }, user }) => {
      // process input
      const {
        kpiInput, signKPIInput, signActualInput, attachmentInput,
        SIGN_KPI_ID, SIGN_ACTUAL_ID, ATTACHMENT_ID,
      } = processGetxData(input, user);

      // KPI
      const searchOptsKPI = {
        object: kpiInput,
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
        },
      };
      const resultKPI = await MysqlGetxKPI.update(searchOptsKPI);

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
        await MysqlGetxSign.update(searchOptsSignKPI);
      } else {
        const getXSignKPIInput = {
          ...signKPIInput,
          ID: generateId(),
          GETX_ID: kpiInput.ID,
        };
        await MysqlGetxSign.create(getXSignKPIInput);
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
        await MysqlGetxSign.update(searchOptsSignActual);
      } else {
        const getXSignActualInput = {
          ...signActualInput,
          ID: generateId(),
          GETX_ID: kpiInput.ID,
        };
        await MysqlGetxSign.create(getXSignActualInput);
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
        await MysqlGetxAttachment.update(searchOptsAttachment);
      } else {
        const getXAttachmentInput = {
          ...attachmentInput,
          ID: generateId(),
          GETX_ID: kpiInput.ID,
        };
        await MysqlGetxAttachment.create(getXAttachmentInput);
      }

      // result
      const result2 = {
        ID: input.COMPANY_ID,
        updated: resultKPI[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    }),
    finalizeKPI: kpiResolver.createResolver(async (
      parent, { input }, {
        connectors: {
          MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment,
        },
        user,
      },
    ) => {
      // kpi
      const searchOptsKPI = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resKPI = await MysqlGetxKPI.findOne(searchOptsKPI);
      const KPIInput = resKPI.dataValues;
      const KPIHist = generateHistory(user.mail, 'CREATE');
      const finalKPI = {
        ...KPIInput,
        ...KPIHist,
        KPI_DATE: moment(KPIInput.KPI_DATE, 'x').add(-8, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        ID: generateId(),
      };
      await MysqlGetxKPI.create(finalKPI);

      // attachment
      const searchOptsAtt = { where: { COMPANY_ID: input.COMPANY_ID } };
      const resAtt = await MysqlGetxAttachment.findOne(searchOptsAtt);
      const attInput = resAtt.dataValues;
      const attHist = generateHistory(user.mail, 'CREATE');
      const finalAtt = {
        ...attInput,
        ...attHist,
        ASSESSMENT_YEAR: input.ASSESSMENT_YEAR,
        ID: generateId(),
        GETX_ID: finalKPI.ID,
      };
      await MysqlGetxAttachment.create(finalAtt);

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
        const history = generateHistory(user.mail, 'CREATE');
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
      await MysqlGetxSign.bulkCreate(signInput);

      return input;
    }),
  },
};
