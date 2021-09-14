const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { checkPermission } = require('../../helper/common');
const { stateList } = require('../../helper/parameter');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneCompany: isAuthenticatedResolver.createResolver(async (
      parent, { ID }, {
        connectors: { MysqlSlvCompanyProfile, MysqlSlvMSIC },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('COMPANY-READ', userRoleList)) throw new ForbiddenError();

      const searchOpts = {
        where: null,
        order: [['MSIC']],
      };
      const result = await MysqlSlvMSIC.findAll(searchOpts);
      const result2 = result.map((x) => x.dataValues);

      const res = await MysqlSlvCompanyProfile.findById(ID);
      if (!res) {
        throw new Error(`No record found with id ${ID}`);
      }
      const finalResult = {
        allMSIC: result2,
        company: res,
      };
      return finalResult;
    }),
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.msic msic
         */
    allCompanies: isAuthenticatedResolver.createResolver(async (
      parent, param, {
        connectors: {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment, MysqlGetxKPI,
        },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('COMPANY-READ', userRoleList)) throw new ForbiddenError();

      let where = { CREATED_BY: mail };

      // check module admin
      if (userRoleList.DATA_VIEW === 'MODULE') {
        where = { MODULE: userRoleList.MODULE };
      }
      // check admin
      if (userRoleList.MODULE === 'ALL') {
        where = null;
      }

      // company
      const searchOpts = {
        where,
        order: [['ENTITY_NAME']],
      };
      const result = await MysqlSlvCompanyProfile.findAll(searchOpts);
      const resultCompany = result.map((x) => x.dataValues);

      // survey + assessment
      const searchOpts2 = { where: null };
      const resultQuest = await MysqlSlvSurvey.findAll(searchOpts2);
      const resultScore = await MysqlSlvAssessment.findAll(searchOpts2);
      const resultKPI = await MysqlGetxKPI.findAll(searchOpts2);

      // compile result
      const resultFinal = resultCompany.map((x) => {
        const resQ = resultQuest
          .map((yy) => yy.dataValues)
          .filter((y) => y.COMPANY_ID === x.ID
          && y.ASSESSMENT_YEAR === 1000);

        const resS = resultScore
          .map((zz) => zz.dataValues)
          .filter((z) => z.COMPANY_ID === x.ID
            && z.ASSESSMENT_YEAR === 1000);

        const resK = resultKPI
          .map((aa) => aa.dataValues)
          .filter((a) => a.COMPANY_ID === x.ID
                && a.ASSESSMENT_YEAR === 1000);

        const SURVEY_DONE = resQ.length !== 0;
        const ASSESSMENT_DONE = resS.length !== 0;
        const KPI_DONE = resK.length !== 0;
        const SME_CLASS = resQ.length !== 0 ? resQ[0].SME_CLASS : 'N/A';

        return {
          ...x,
          SME_CLASS,
          SURVEY_DONE,
          ASSESSMENT_DONE,
          KPI_DONE,
        };
      });
      // console.dir(resultQuest, { depth: null, colorized: true });
      return resultFinal;
    }),
    /**
         * Retrieve completed process by user
         * @param {Object} param0 main input object
         */
    userReports: isAuthenticatedResolver.createResolver(async (
      parent, param, {
        connectors: {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment,
          MysqlSlvUser, MysqlSlvUserRole,
        },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('COMPANY-READ', userRoleList)) throw new ForbiddenError();

      let where = { MODULE: userRoleList.MODULE };

      // check admin
      if (userRoleList.MODULE === 'ALL') {
        where = null;
      }

      const searchOpts = { where };

      // user
      const searchOptsUser = {
        where,
        order: [['USER']],
      };
      const resUser = await MysqlSlvUser.findAll(searchOptsUser);
      const resultUser = resUser.map((x) => x.dataValues);

      // user role
      const resultUserRole = await MysqlSlvUserRole.findAll(searchOpts);
      // company
      const resultCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      // survey
      const resultQuest = await MysqlSlvSurvey.findAll(searchOpts);
      // assessment
      const resultScore = await MysqlSlvAssessment.findAll(searchOpts);

      // compile result
      const resultFinal = resultUser.map((x) => {
        const resUR = resultUserRole.filter((vv) => x.ROLE === vv.ID)[0];

        const resC = resultCompany
          .map((ww) => ww.dataValues)
          .filter((w) => w.CREATED_BY === x.USER);

        const resQ = resultQuest
          .map((yy) => yy.dataValues)
          .filter((y) => y.CREATED_BY === x.USER
          && y.ASSESSMENT_YEAR === 1000);

        const resS = resultScore
          .map((zz) => zz.dataValues)
          .filter((z) => z.CREATED_BY === x.USER
            && z.ASSESSMENT_YEAR === 1000);

        return {
          USER: x.USER.includes('@') ? x.USER.substring(0, x.USER.lastIndexOf('@')) : x.USER,
          ROLE_NAME: resUR.NAME,
          STATUS: x.STATUS,
          PROFILE_COUNT: resC.length,
          SURVEY_COUNT: resQ.length,
          ASSESSMENT_COUNT: resS.length,
        };
      });
      // console.dir(resultFinal, { depth: null, colorized: true });
      return resultFinal;
    }),
    stateReports: isAuthenticatedResolver.createResolver(async (
      parent, param, {
        connectors: { MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('COMPANY-READ', userRoleList)) throw new ForbiddenError();

      let where = { CREATED_BY: mail };
      let resultCompany = [];
      let resultQuest = [];
      let resultScore = [];

      // check module admin
      if (userRoleList.DATA_VIEW === 'MODULE') {
        where = { MODULE: userRoleList.MODULE };
      }
      // check admin
      if (userRoleList.MODULE === 'ALL') {
        where = null;
      }
      const searchOpts = { where };

      // Assessment
      const resScore = await MysqlSlvSurvey.findAll(searchOpts);
      if (resScore.length !== 0) {
        resultScore = resScore
          .map((a) => a.dataValues)
          .filter((oa) => oa.ASSESSMENT_YEAR === 1000);
      }

      // Survey
      const resQuest = await MysqlSlvAssessment.findAll(searchOpts);
      if (resQuest.length !== 0) {
        resultQuest = resQuest
          .map((s) => s.dataValues)
          .filter((oa) => oa.ASSESSMENT_YEAR === 1000);
      }

      // company
      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      resultCompany = resCompany
        .map((x) => {
          const resC = x.dataValues;
          const resQ = resultQuest.filter((y) => y.COMPANY_ID === resC.ID);
          const resS = resultScore.filter((z) => z.COMPANY_ID === resC.ID);
          return {
            ...resC,
            SME_CLASS: resQ.length !== 0 ? resQ[0].SME_CLASS : 'N/A',
            ASSESSMENT_DONE: resS.length,
          };
        })
        .filter((cls) => cls.SME_CLASS !== 'LARGE ENTERPRISE' && cls.SME_CLASS !== 'N/A')
        .filter(((as) => as.ASSESSMENT_DONE !== 0));

      // get count list
      const stateStats = stateList.map((st) => {
        const count = resultCompany.filter((c) => c.STATE === st).length;
        // const colorCount = Math.round((count / resultCompany.length) * 20);
        return {
          STATE: st,
          COUNT: count,
        };
      });

      // get value for color (max 20)
      const stateStatsColor = stateStats.map((y) => {
        const countList = stateStats.map((z) => z.COUNT);
        const maxCount = Math.max(...countList);
        const countColor = Math.round((y.COUNT / maxCount) * 20);
        return {
          ...y,
          COUNT_COLOR: countColor,
        };
      });

      return stateStatsColor;
    }),
  },
  Mutation: {
    createCompany: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvCompanyProfile },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('COMPANY-CREATE', userRoleList)) throw new ForbiddenError();

      const parsedInput = JSON.parse(input.data);
      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...parsedInput,
        ID: generateId(),
        MODULE: userRoleList.MODULE,
        ...history,
      };
        //   console.log(newInput);
      return MysqlSlvCompanyProfile.create(newInput);
    }),
    deleteCompany: isAuthenticatedResolver.createResolver(async (
      parent, { ID }, {
        connectors: {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvELSAScorecard,
        },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('COMPANY-DELETE', userRoleList)) throw new ForbiddenError();

      // remove company
      const searchOpts = { where: { ID } };
      const result = await MysqlSlvCompanyProfile.delete(searchOpts);

      // remove company from other tables
      const searchOpts2 = {
        where: { COMPANY_ID: ID },
      };
      await MysqlSlvSurvey.delete(searchOpts2);
      await MysqlSlvAssessment.delete(searchOpts2);
      await MysqlSlvELSAScorecard.delete(searchOpts2);

      const result2 = {
        ID,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    }),
    updateCompany: isAuthenticatedResolver.createResolver(async (
      parent, { ID, input }, {
        connectors: { MysqlSlvCompanyProfile },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('COMPANY-UPDATE', userRoleList)) throw new ForbiddenError();

      const parsedInput = JSON.parse(input.data);
      const history = generateHistory(mail, 'UPDATE', parsedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...parsedInput,
          ...history,
        },
        where: { ID },
      };
      const result = await MysqlSlvCompanyProfile.update(searchOpts);
      const result2 = {
        ID,
        updated: result[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    }),
    unlistCompany: isAuthenticatedResolver.createResolver(async (
      parent, { ID }, {
        connectors: { MysqlSlvCompanyProfile },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('GETX-DELETE', userRoleList)) throw new ForbiddenError();

      // search company
      const res = await MysqlSlvCompanyProfile.findById(ID);

      // update flag to NO
      const history = generateHistory(mail, 'UPDATE', res.CREATED_AT);
      const searchOpts = {
        object: {
          ...res,
          ...history,
          GETX_FLAG: 'NO',
        },
        where: { ID },
      };
      const result = await MysqlSlvCompanyProfile.update(searchOpts);
      const result2 = {
        ID,
        updated: result[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    }),
  },
};
