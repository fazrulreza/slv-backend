const { generateId, generateHistory } = require('../../../packages/mysql-model');
const { companyResolver, allSLVResolver, allResolver } = require('../../permissions/acl');

module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneCompany: companyResolver.createResolver(async (
      parent,
      { ID }, { connectors: { MysqlSlvCompanyProfile, MysqlSlvMSIC } },
    ) => {
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
    allCompanies: allSLVResolver.createResolver(async (
      parent, param,
      {
        connectors: {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment, MysqlGetxKPI,
        },
        user: { mail, userType },
      },
    ) => {
      let where = { CREATED_BY: mail };

      // check admin
      if (userType === 'ADMIN') {
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
    userReports: allResolver.createResolver(async (
      parent, param,
      {
        connectors: {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvUserRole,
        },
        // user: { mail, userType },
      },
    ) => {
      const searchOpts = { where: null };

      // user
      const searchOptsUser = {
        where: null,
        order: [['USER']],
      };
      const resUser = await MysqlSlvUserRole.findAll(searchOptsUser);
      const resultUser = resUser.map((x) => x.dataValues);

      // company
      const resultCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);

      // survey
      const resultQuest = await MysqlSlvSurvey.findAll(searchOpts);
      // assessment
      const resultScore = await MysqlSlvAssessment.findAll(searchOpts);

      // compile result
      const resultFinal = resultUser.map((x) => {
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
          ROLE: x.ROLE,
          PROFILE_COUNT: resC.length,
          SURVEY_COUNT: resQ.length,
          ASSESSMENT_COUNT: resS.length,
        };
      });
      // console.dir(resultQuest, { depth: null, colorized: true });
      return resultFinal;
    }),
  },
  Mutation: {
    createCompany: companyResolver.createResolver(async (
      parent, { input }, { connectors: { MysqlSlvCompanyProfile }, user },
    ) => {
      const parsedInput = JSON.parse(input.data);
      const history = generateHistory(user.mail, 'CREATE');
      const newInput = {
        ...parsedInput,
        ID: generateId(),
        ...history,
      };
        //   console.log(newInput);
      return MysqlSlvCompanyProfile.create(newInput);
    }),
    deleteCompany: companyResolver.createResolver(async (
      parent,
      { ID },
      {
        connectors: {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvELSAScorecard,
        },
      },
    ) => {
      // remove company
      const searchOpts = {
        where: { ID },
      };
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
    updateCompany: companyResolver.createResolver(async (
      parent,
      { ID, input },
      { connectors: { MysqlSlvCompanyProfile } },
      user,
    ) => {
      const parsedInput = JSON.parse(input.data);
      const history = generateHistory(user.mail, 'UPDATE', parsedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...parsedInput,
          ...history,
        },
        where: {
          ID,
        },
      };
      const result = await MysqlSlvCompanyProfile.update(searchOpts);
      const result2 = {
        ID,
        updated: result[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    }),
    unlistCompany: companyResolver.createResolver(async (
      parent,
      { ID },
      { connectors: { MysqlSlvCompanyProfile } },
      user,
    ) => {
      // search company
      const res = await MysqlSlvCompanyProfile.findById(ID);

      // update flag to NO
      const history = generateHistory(user.mail, 'UPDATE', res.CREATED_AT);
      const searchOpts = {
        object: {
          ...res,
          ...history,
          GETX_FLAG: 'NO',
        },
        where: {
          ID,
        },
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
