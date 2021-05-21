const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { getTotalScore } = require('../../helper/common');
const { kpiElsaResolver, kpiResolver, kpiCompanyResolver } = require('../../permissions/acl');

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
  const COMMENT = data[`${type}COMMENT`];

  return {
    CURRENT,
    TARGET,
    ACHIEVEMENT,
    PERCENT,
    COMMENT,
    QUARTERS,
  };
};

module.exports = {
  Query: {

    dashboardKPI: kpiCompanyResolver.createResolver(async (
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
          const EXPORT_REVENUE = getKPIscores(resTemp, 'EXPORT_REVENUE_');
          // console.log(resTemp);
          // console.log(resTurnover);

          return {
            TURNOVER,
            PROFITABILITY,
            SKILLED,
            UNSKILLED,
            DIVERSIFY,
            TECHNOLOGY,
            EXPORT_REVENUE,
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
          MysqlGetxKPI, MysqlGetxSign, MysqlSlvELSAScorecard, MysqlSlvAssessment,
        },
      },
    ) => {
      let result = [];
      let newResult = [];
      const searchOpts = { where: { COMPANY_ID } };

      // KPI
      const resKPI = await MysqlGetxKPI.findAll(searchOpts);
      const resSign = await MysqlGetxSign.findAll(searchOpts);

      // Elsa
      const resElsa = await MysqlSlvELSAScorecard.findAll(searchOpts);

      // Assessment
      const resScore = await MysqlSlvAssessment.findAll(searchOpts);

      if (resKPI.length !== 0) {
        result = resKPI.map((kpi) => {
          const result2 = kpi.dataValues;
          let resSignKPI2 = {};
          let resSignActual2 = {};

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

          // calculate total score
          const totalFinalScore = getTotalScore(resElsa2);

          newResult = {
            KPI: {
              ...result2,
              ...resSignKPI2,
              ...resSignActual2,
            },
            ELSA: resElsa2,
            assessment: resScore2[0],
            TOTAL_FINAL_SCORE: totalFinalScore,
            ASSESSMENT_YEAR: result2.ASSESSMENT_YEAR,
          };

          return newResult;
        });
      } else {
        // elsa
        const resElsa4 = resElsa
          .map(e1 => e1.dataValues)
          .filter(e2 => e2.COMPANY_ID === COMPANY_ID
            && e2.ASSESSMENT_YEAR === 1000);

        // assessment
        const resScore4 = resScore
          .map(s1 => s1.dataValues)
          .filter(s2 => s2.COMPANY_ID === COMPANY_ID
            && s2.ASSESSMENT_YEAR === 1000);

        // calculate total score
        const totalFinalScore2 = getTotalScore(resElsa4);

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
      parent, { input }, { connectors: { MysqlGetxKPI, MysqlGetxSign }, user }) => {
      // process input
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
        // others
        ...others
      } = parsedInput;

      const history = generateHistory(user.mail, 'CREATE');

      const getXKPIInput = {
        ...others,
        ...history,
        COMPANY_ID: input.COMPANY_ID,
        ASSESSMENT_YEAR: 1000,
        ID: generateId(),
      };

      // kpi
      const getXSignKPIInput = {
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
        GETX_ID: getXKPIInput.ID,
        ...history,
        ID: generateId(),
      };

      // achievement
      const getXSignActualInput = {
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
        GETX_ID: getXKPIInput.ID,
        ...history,
        ID: generateId(),
      };
        // console.log(newInput);
      const resultKPI = await MysqlGetxKPI.create(getXKPIInput);
      await MysqlGetxSign.create(getXSignKPIInput);
      await MysqlGetxSign.create(getXSignActualInput);

      return resultKPI;
    }),
    updateGetXKPI: kpiResolver.createResolver(async (
      parent, { input }, { connectors: { MysqlGetxKPI, MysqlGetxSign }, user }) => {
      // process input
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
        // others
        ...others
      } = parsedInput;

      const history = generateHistory(user.mail, 'UPDATE', parsedInput.CREATED_AT);

      // KPI
      const searchOptsKPI = {
        object: {
          ...others,
          ...history,
        },
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
        },
      };
      const resultKPI = await MysqlGetxKPI.update(searchOptsKPI);

      // Sign
      const searchOptsSignKPI = {
        object: {
          ID: SIGN_KPI_ID,
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
          GETX_ID: parsedInput.ID,
          ...history,
        },
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
          ID: SIGN_KPI_ID,
        },
      };

      const searchOptsSignActual = {
        object: {
          ID: SIGN_ACTUAL_ID,
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
          GETX_ID: parsedInput.ID,
          ...history,
        },
        where: {
          COMPANY_ID: input.COMPANY_ID,
          ASSESSMENT_YEAR: 1000,
          ID: SIGN_ACTUAL_ID,
        },
      };

      await MysqlGetxSign.update(searchOptsSignKPI);
      await MysqlGetxSign.update(searchOptsSignActual);

      // result
      const result2 = {
        ID: input.COMPANY_ID,
        updated: resultKPI[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    }),
  },
};
