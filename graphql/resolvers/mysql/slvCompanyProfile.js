const moment = require('moment');
const { Op } = require('sequelize');
const { generateId, generateHistory } = require('../../../packages/mysql-model');
const {
  checkPermission, getRoleWhere, getCurrentData, getFilteredData,
} = require('../../helper/common');
const { stateList, requiredCompanyFields } = require('../../helper/parameter');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { InvalidDataError, CompanyExistsError, DataTooLongError } = require('../../permissions/errors');
const logger = require('../../../packages/logger');
const {
  oneCompanyRule, allCompaniesRule, userReportsRule, stateReportsRule,
  checkCompanyRule, createCompanyRule, deleteCompanyRule, updateCompanyRule, unlistCompanyRule,
} = require('../../permissions/rule');

/**
 * Helper function for simple update in DB
 * @param {string} ID ID
 * @param {Object} updateTable Sequelize object for table to be updated
 * @param {string} module module of the company
 * @param {string} mail mail for update
 * @returns {string} update status
 */
const updateModuleinDB = async (ID, updateTable, module, mail) => {
  const searchOpts2 = {
    where: {
      ASSESSMENT_YEAR: 1000,
      COMPANY_ID: ID,
    },
  };

  const resUpdate = await updateTable.findAll(searchOpts2);
  if (!resUpdate) return 'does not exist';

  const resultUpdate = resUpdate[0].dataValues;

  if (resultUpdate.MODULE !== module) {
    const history = generateHistory(mail, 'UPDATE', resultUpdate.CREATED_AT);
    const searchOpts = {
      object: {
        MODULE: module,
        ...history,
      },
      where: {
        ASSESSMENT_YEAR: 1000,
        COMPANY_ID: ID,
      },
    };

    await updateTable.update(searchOpts);
    return 'update complete';
  }

  return 'no update required';
};

/**
 * Check if date is valid or not
 * @param {string} dateString date String
 * @returns {Boolean} valid date or not
 */
const isValidDate = (dateString) => {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) return false; // Invalid format
  const d = new Date(dateString);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
  return d.toISOString().slice(0, 10) === dateString;
};

/**
 * Validation for company profile fields
 * @param {Object} input Main input object
 */
const checkCompanyDetails = (input) => {
  // check not empty
  Object.keys(requiredCompanyFields).forEach((y) => {
    if (!input[y]) {
      logger.error(`checkCompanyDetails --> Invalid ${requiredCompanyFields[y]}`);
      throw new InvalidDataError({ message: `Invalid ${requiredCompanyFields[y]}` });
    }
  });

  // entity name
  if (input.ENTITY_NAME && input.ENTITY_NAME.length > 255) {
    logger.error('checkCompanyDetails --> Company Name is too long');
    throw new DataTooLongError({ message: 'Company Name is too long' });
  }
  // registration no
  if (input.REGISTRATION_NO && input.REGISTRATION_NO.length > 50) {
    logger.error('checkCompanyDetails --> Registration Number is too long');
    throw new DataTooLongError({ message: 'Registration Number is too long' });
  }
  // new registration no
  if (input.NEW_REGISTRATION_NO && input.NEW_REGISTRATION_NO.length > 50) {
    logger.error('checkCompanyDetails --> New Registration Number is too long');
    throw new DataTooLongError({ message: 'New Registration Number is too long' });
  }
  // incorporation date
  if (input.INCORPORATION_DATE && !isValidDate(input.INCORPORATION_DATE)) {
    logger.error('checkCompanyDetails --> Invalid Incorporation Date');
    throw new InvalidDataError({ message: 'Invalid Incorporation Date' });
  }
  // bumiputera status
  if (!input.BUMI_STATUS) {
    logger.error('checkCompanyDetails --> Invalid Bumiputera Status');
    throw new InvalidDataError({ message: 'Invalid Bumiputera Status' });
  }
  // address line 1
  if (input.ADDRESS_LINE_1 && input.ADDRESS_LINE_1.length > 255) {
    logger.error('checkCompanyDetails --> Address Line 1 is too long');
    throw new DataTooLongError({ message: 'Address Line 1 is too long' });
  }
  // address line 2
  if (input.ADDRESS_LINE_2 && input.ADDRESS_LINE_2.length > 255) {
    logger.error('checkCompanyDetails --> Address Line 2 is too long');
    throw new DataTooLongError({ message: 'Address Line 2 is too long' });
  }
  // postcode
  const postcodeRegex = /^\d{5}$/gi;
  if (input.POSTCODE && !postcodeRegex.test(input.POSTCODE)) {
    logger.error('checkCompanyDetails --> Invalid Postcode');
    throw new InvalidDataError({ message: 'Invalid PostCode' });
  }
  // postcode
  const phoneRegex = /^\d{9,12}$/gi;
  if (input.PHONE && !phoneRegex.test(input.PHONE)) {
    logger.error('checkCompanyDetails --> Invalid Phone Number');
    throw new InvalidDataError({ message: 'Invalid Phone Number' });
  }
  // email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@.]+$/gi;
  if (input.EMAIL && !emailRegex.test(input.EMAIL)) {
    logger.error('checkCompanyDetails --> Invalid Email Address');
    throw new InvalidDataError({ message: 'Invalid Email Address' });
  }
  // Financing Agency 1
  if (input.FIN_AGENCY_1 && input.FIN_AGENCY_1.length > 255) {
    logger.error('checkCompanyDetails --> Financing Agency 1 is too long');
    throw new DataTooLongError({ message: 'Financing Agency 1 is too long' });
  }
  // Financing Agency 2
  if (input.FIN_AGENCY_2 && input.FIN_AGENCY_2.length > 255) {
    logger.error('checkCompanyDetails --> Financing Agency 2 is too long');
    throw new DataTooLongError({ message: 'Financing Agency 2 is too long' });
  }
  // Financing Agency 3
  if (input.FIN_AGENCY_3 && input.FIN_AGENCY_3.length > 255) {
    logger.error('checkCompanyDetails --> Financing Agency 3 is too long');
    throw new DataTooLongError({ message: 'Financing Agency 3 is too long' });
  }
  // nature of business
  if (input.NATURE_OF_BUSINESS && input.NATURE_OF_BUSINESS.length > 1000) {
    logger.error('checkCompanyDetails --> Nature of Business is too long');
    throw new DataTooLongError({ message: 'Nature of Business is too long' });
  }
};

/**
 * Check if company already exist in DB
 * @param {string} ENTITY_NAME company name
 * @param {object} MysqlSlvCompanyProfile Company Profile Connector Object
 * @param {string} process name of the process calling the function
 * @param {string} [ID=new] company ID
 * @returns {string} N/A
 */
const checkCompanyExist = async (ENTITY_NAME, MysqlSlvCompanyProfile, process, ID = 'new') => {
  const searchExistOpts = {
    where: { ENTITY_NAME },
  };
  const resCompany = await MysqlSlvCompanyProfile.findOne(searchExistOpts);
  const resultCompany = resCompany ? resCompany.dataValues : 'N/A';

  // checkCompany @ createCompany ? N/A = Good
  // updateCompany ? N/A = Bad, ID not equal to DB ID = Bad
  if (
    ((process === 'checkCompany' || process === 'createCompany') && resultCompany !== 'N/A')
    || (process === 'updateCompany' && (resultCompany === 'N/A' || ID !== resCompany.dataValues.ID))
  ) {
    logger.error(`${process} --> Company already exist`);
    throw new CompanyExistsError();
  }
  return resultCompany;
};

/**
 *
 * @param {string} MSIC MSIC
 * @param {Object} MysqlSlvMSIC MSIC Connector Object
 * @param {string} process ame of the process calling the function
 * @returns {object} MSIC set
 */
const checkValidSection = async (SECTION, MysqlSlvMSIC, process) => {
  const searchOptsSection = {
    where: { SECTION },
  };
  const resSection = await MysqlSlvMSIC.findOne(searchOptsSection);
  const resultSection = resSection ? resSection.dataValues : null;

  if (!resultSection) {
    logger.error(`${process} --> Invalid Section`);
    throw new InvalidDataError({ message: 'Invalid Section' });
  }

  return {
    SECTOR: resultSection.sector,
    SECTION: resultSection.section,
    // DIVISION: resultMSIC.division,
    // GROUP: resultMSIC.group,
    // CLASS: resultMSIC.class,
    // MSIC: resultMSIC.MSIC,
  };
};

module.exports = {
  Query: {
    /**
     * Retrieve one by ID
     * @param {Object} param0 main input object
     * @param {String} param0.id company id
     */
    oneCompany: isAuthenticatedResolver.createResolver(async (parent, { ID }, {
      connectors: { MysqlSlvCompanyProfile, MysqlSlvModule, MysqlSlvMSIC },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`oneCompany --> by ${mail} input: ${ID}`);
      checkPermission(oneCompanyRule, userRoleList, userType, 'oneCompany');

      // get company (if any)
      const res = await MysqlSlvCompanyProfile.findById(ID);
      if (!res) {
        logger.error(`oneCompany --> No record found for ${ID}`);
        throw new Error(`No record found with for ${ID}`);
      }
      const newCompany = {
        ...res.dataValues,
        LOGO: JSON.parse(res.dataValues.LOGO),
        MODULE: JSON.parse(res.dataValues.MODULE),
      };
      logger.debug(`oneCompany --> Company data found: ${JSON.stringify(newCompany)}`);

      // get MSIC list
      const searchOptsMsic = {
        where: null,
        order: [['MSIC']],
      };
      const resMSIC = await MysqlSlvMSIC.findAll(searchOptsMsic);
      const resultMSIC = resMSIC.map((x) => x.dataValues);
      logger.debug('oneCompany --> MSIC data found');

      // get Modules list
      const searchOptsModules = { where: null };
      const resModules = await MysqlSlvModule.findAll(searchOptsModules);
      const resultModules = resModules.map((x) => x.dataValues);
      logger.debug('oneCompany --> Module data found');

      const finalResult = {
        allMSIC: resultMSIC,
        allModuls: resultModules,
        company: newCompany,
      };

      logger.debug(`oneCompany --> output: ${JSON.stringify(finalResult)}`);
      logger.info(`oneCompany --> by ${mail} completed`);
      return finalResult;
    }),
    /**
     * Retrieve all
     * @param {Object} param0 main input object
     * @param {String} param0.filter filter to be applied
     */
    allCompanies: isAuthenticatedResolver.createResolver(async (parent, { filter }, {
      connectors: {
        MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment, MysqlGetxKPI,
      },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`allCompanies --> by ${mail} called with no input`);
      checkPermission(allCompaniesRule, userRoleList, userType, 'allCompanies');

      let resultCompany = [];

      const where = getRoleWhere(userRoleList, mail);
      logger.debug(`allCompanies --> search criteria: ${JSON.stringify(where)}`);

      // company
      const searchOpts = {
        where,
        order: [['ENTITY_NAME']],
      };

      const searchOptsAll = { where: null };

      // survey
      const resultQuest = await getCurrentData(MysqlSlvSurvey, searchOptsAll, 'allCompanies', 'survey');

      // assessment
      const resultScore = await getCurrentData(MysqlSlvAssessment, searchOptsAll, 'allCompanies', 'assessment');

      // getx
      const resultKPI = await getCurrentData(MysqlGetxKPI, searchOptsAll, 'allCompanies', 'getx');

      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      logger.debug(`allCompanies --> total company found: ${resultCompany.length}`);

      // compile result
      resultCompany = resCompany.map((x) => {
        const resC = x.dataValues;
        const resC1 = {
          ...resC,
          LOGO: JSON.parse(resC.LOGO),
          MODULE: JSON.parse(resC.MODULE),
        };
        const resQ = resultQuest.filter((y) => y.COMPANY_ID === x.ID);
        const resS = resultScore.filter((z) => z.COMPANY_ID === x.ID);
        const resK = resultKPI.filter((a) => a.COMPANY_ID === x.ID);

        const SURVEY_DONE = resQ.length !== 0;
        const ASSESSMENT_DONE = resS.length !== 0;
        const KPI_DONE = resK.length !== 0;

        const resQ1 = resQ.length !== 0 ? resQ[0] : null;
        const resS1 = resS.length !== 0 ? resS[0] : null;
        const resK1 = resK.length !== 0 ? resK[0] : null;

        return {
          ...resQ1,
          ...resS1,
          ...resK1,
          ...resC1,
          SURVEY_DONE,
          ASSESSMENT_DONE,
          KPI_DONE,
          company: resC1,
        };
      });

      resultCompany = getFilteredData(resultCompany, filter);

      const resultFinal = resultCompany.map((m) => ({
        ...m.company,
        SURVEY_DONE: m.SURVEY_DONE,
        ASSESSMENT_DONE: m.ASSESSMENT_DONE,
        KPI_DONE: m.KPI_DONE,
        SME_CLASS: m.SME_CLASS ? m.SME_CLASS : 'N/A',
      }));

      // console.dir(resultQuest, { depth: null, colorized: true });
      logger.debug(`allCompanies --> output total: ${resultCompany.length}`);
      logger.info(`allCompanies --> by ${mail} completed`);
      return resultFinal;
    }),
    /**
     * Retrieve completed process by user
     * @param {Object} param0 main input object
     */
    userReports: isAuthenticatedResolver.createResolver(async (parent, param, {
      connectors: {
        MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment,
        MysqlSlvUser, MysqlSlvUserRole,
      },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`userReports --> by ${mail} called with no input`);
      checkPermission(userReportsRule, userRoleList, userType, 'userReports');

      const where = getRoleWhere(userRoleList, mail);
      logger.debug(`userReports --> search criteria: ${JSON.stringify(where)}`);
      const searchOpts = { where };

      // user role
      const resultUserRole = await MysqlSlvUserRole.findAll(searchOpts);
      const roleIds = resultUserRole.map((x) => x.dataValues.ID);
      logger.debug(`userReports --> total user roles found: ${resultUserRole.length}`);

      // user
      const searchOptsUser = {
        where: { ROLE: { [Op.in]: roleIds } },
        order: [['USER']],
      };
      const resUser = await MysqlSlvUser.findAll(searchOptsUser);
      const resultUser = resUser.map((x) => x.dataValues);
      logger.debug(`userReports --> total user: ${resultUser.length}`);

      // company
      const resultCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      logger.debug(`userReports --> total companies found: ${resultCompany.length}`);

      // survey
      const resultQuest = await MysqlSlvSurvey.findAll(searchOpts);
      logger.debug(`userReports --> total survey found: ${resultQuest.length}`);

      // assessment
      const resultScore = await MysqlSlvAssessment.findAll(searchOpts);
      logger.debug(`userReports --> total assessment found: ${resultScore.length}`);

      // compile result
      const resultFinal = resultUser.map((x) => {
        const resUR = resultUserRole.filter((vv) => x.ROLE === vv.ID)[0];

        const resC = resultCompany
          .map((ww) => ww.dataValues)
          .filter((w) => w.CREATED_BY === x.USER);

        const resQ = resultQuest
          .map((yy) => yy.dataValues)
          .filter((y) => y.CREATED_BY === x.USER && y.ASSESSMENT_YEAR === 1000);

        const resS = resultScore
          .map((zz) => zz.dataValues)
          .filter((z) => z.CREATED_BY === x.USER && z.ASSESSMENT_YEAR === 1000);

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
      logger.debug(`userReports --> output: ${JSON.stringify(resultFinal)}`);
      logger.info(`userReports --> by ${mail} completed`);

      return resultFinal;
    }),
    /**
     * Retrieve data for company by state report
     * @param {Object} param0 main input object
     * @param {Object} param0.filter filter to be applied
     */
    stateReports: isAuthenticatedResolver.createResolver(async (parent, { filter }, {
      connectors: { MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`stateReports --> by ${mail} called with filter ${JSON.stringify(filter)}`);
      checkPermission(stateReportsRule, userRoleList, userType, 'stateReports');

      let resultCompany = [];

      const where = getRoleWhere(userRoleList, mail);
      logger.debug(`stateReports --> search criteria: ${JSON.stringify(where)}`);
      const searchOpts = { where };
      const searchOptsAll = { where: null };

      // Survey
      const resultQuest = await getCurrentData(MysqlSlvSurvey, searchOptsAll, 'stateReports', 'survey');

      // Assessment
      const resultScore = await getCurrentData(MysqlSlvAssessment, searchOptsAll, 'stateReports', 'assessment');

      // company
      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      logger.debug(`stateReports --> total companies found: ${resCompany.length}`);

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
        .filter((as) => as.SURVEY_DONE !== 0);

      resultCompany = getFilteredData(resultCompany, filter);

      // get count list
      const stateStats = stateList.map((st) => {
        const count = resultCompany.filter((c) => c.STATE === st).length;
        // const colorCount = Math.round((count / resultCompany.length) * 20);
        return {
          STATE: st,
          COUNT: count,
        };
      });
      logger.debug(`stateReports --> state data with stats: ${JSON.stringify(stateStats)}`);

      // get value for color (max 20)
      const stateStatsColor = stateStats.map((y) => {
        const countList = stateStats.map((z) => z.COUNT);
        const maxCount = Math.max(...countList);
        const countColor = Math.round((y.COUNT / maxCount) * 20);
        return {
          ...y,
          COUNT_COLOR: countColor,
        };
      })
        .sort((curr, next) => next.COUNT - curr.COUNT);

      logger.debug(`stateReports --> output: ${JSON.stringify(stateStatsColor)}`);
      logger.info(`stateReports --> by ${mail} completed`);
      return stateStatsColor;
    }),
  },
  Mutation: {
    /**
     * Retrieve one by name
     * @param {Object} param0 main input object
     * @param {String} param0.NAME company name
     */
    checkCompany: isAuthenticatedResolver.createResolver(async (
      parent,
      { NAME },
      { connectors: { MysqlSlvCompanyProfile }, user: { mail, userRoleList, userType } },
    ) => {
      logger.info(`checkCompany --> by ${mail} input: ${NAME}`);
      checkPermission(checkCompanyRule, userRoleList, userType, 'checkCompany');

      const result = await checkCompanyExist(NAME, MysqlSlvCompanyProfile, 'checkCompany');

      logger.debug(`checkCompany --> input: ${result}`);
      logger.info(`checkCompany --> by ${mail} completed`);

      return result;
    }),
    createCompany: isAuthenticatedResolver.createResolver(async (parent, { input }, {
      connectors: { MysqlSlvCompanyProfile, MysqlSlvUserPublic, MysqlSlvMSIC },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`createCompany --> by ${mail} input: ${JSON.stringify(input)}`);
      checkPermission(createCompanyRule, userRoleList, userType, 'createCompany');

      const parsedInput = JSON.parse(input.data);
      checkCompanyDetails(parsedInput);

      // check for company
      await checkCompanyExist(parsedInput.ENTITY_NAME, MysqlSlvCompanyProfile, 'createCompany');

      // check for MSIC
      const MSICObject = await checkValidSection(parsedInput.SECTION, MysqlSlvMSIC, 'createCompany');

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...parsedInput,
        LOGO: JSON.stringify(parsedInput.LOGO),
        MODULE: JSON.stringify(parsedInput.MODULE),
        ID: generateId(),
        OWNER: mail,
        ENTRY_DATE: moment().format('YYYY-MM-DD'),
        ...MSICObject,
        ...history,
      };

      const resCompany = await MysqlSlvCompanyProfile.create(newInput);
      const resultCompany = resCompany.dataValues;

      // if public user, update company ID in profile
      if (userType === 10) {
        logger.debug('createCompany --> Created by public user. Update company owner to user id');
        // find user ID
        const searchOpts = {
          where: { EMAIL: mail },
        };
        const resUser = await MysqlSlvUserPublic.findOne(searchOpts);
        const resultUser = resUser.dataValues;

        // update user
        const historyUpdate = generateHistory(mail, 'UPDATE', resUser.dataValues.CREATED_AT);
        const searchOptsUpdate = {
          object: {
            ...resultUser,
            COMPANY_ID: resultCompany.ID,
            ...historyUpdate,
          },
          where: {
            EMAIL: mail,
          },
        };
        await MysqlSlvUserPublic.update(searchOptsUpdate);
      }
      logger.debug(`createCompany --> output: ${JSON.stringify(resultCompany)}`);
      logger.info(`createCompany --> by ${mail} completed`);

      return resultCompany;
    }),
    deleteCompany: isAuthenticatedResolver.createResolver(async (parent, { ID }, {
      connectors: {
        MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvELSAScorecard,
        MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment,
      },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`deleteCompany --> by ${mail} input: ${ID}`);
      checkPermission(deleteCompanyRule, userRoleList, userType, 'deleteCompany');

      // remove company from other tables
      const searchOpts2 = {
        where: { COMPANY_ID: ID },
      };

      // getx
      await MysqlGetxAttachment.delete(searchOpts2);
      logger.debug('deleteCompany --> Delete getx attachment success');

      await MysqlGetxSign.delete(searchOpts2);
      logger.debug('deleteCompany --> Delete getx signature success');

      await MysqlGetxKPI.delete(searchOpts2);
      logger.debug('deleteCompany --> Delete getx KPI success');

      // elsa
      await MysqlSlvELSAScorecard.delete(searchOpts2);
      logger.debug('deleteCompany --> Delete ELSA Scorecard success');

      await MysqlSlvAssessment.delete(searchOpts2);
      logger.debug('deleteCompany --> Delete Assessment success');

      await MysqlSlvSurvey.delete(searchOpts2);
      logger.debug('deleteCompany --> Delete Survey success');

      // remove company
      const searchOpts = { where: { ID } };
      const result = await MysqlSlvCompanyProfile.delete(searchOpts);
      logger.debug('deleteCompany --> Delete company success');

      const result2 = {
        ID,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      logger.debug(`deleteCompany --> output: ${JSON.stringify(result2)}`);
      logger.info(`deleteCompany --> by ${mail} completed`);

      return result2;
    }),
    updateCompany: isAuthenticatedResolver.createResolver(async (parent, { ID, input }, {
      connectors: {
        MysqlSlvCompanyProfile, MysqlSlvMSIC, MysqlSlvSurvey, MysqlSlvAssessment,
        MysqlSlvELSAScorecard, MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment,
        MysqlGetxAchievement,
      },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`updateCompany --> by ${mail} input ${ID}: ${JSON.stringify(input)}`);
      checkPermission(updateCompanyRule, userRoleList, userType, 'updateCompany');

      const parsedInput = JSON.parse(input.data);
      checkCompanyDetails(parsedInput);

      // check for company
      await checkCompanyExist(parsedInput.ENTITY_NAME, MysqlSlvCompanyProfile, 'updateCompany', ID);

      // check for MSIC
      const MSICObject = await checkValidSection(parsedInput.SECTION, MysqlSlvMSIC, 'createCompany');

      const MODULE = JSON.stringify(parsedInput.MODULE);

      const history = generateHistory(mail, 'UPDATE', parsedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...parsedInput,
          LOGO: JSON.stringify(parsedInput.LOGO),
          MODULE,
          ...MSICObject,
          ...history,
        },
        where: { ID },
      };
      const result = await MysqlSlvCompanyProfile.update(searchOpts);

      const updateSurvey = await updateModuleinDB(ID, MysqlSlvSurvey, MODULE, mail);
      logger.debug(`updateCompany --> Survey ${updateSurvey}`);

      const updateAssessment = await updateModuleinDB(ID, MysqlSlvAssessment, MODULE, mail);
      logger.debug(`updateCompany --> Assessment ${updateAssessment}`);

      const updateElsa = await updateModuleinDB(ID, MysqlSlvELSAScorecard, MODULE, mail);
      logger.debug(`updateCompany --> ELSA Scorecard ${updateElsa}`);

      const updateKPI = await updateModuleinDB(ID, MysqlGetxKPI, MODULE, mail);
      logger.debug(`updateCompany --> GETX KPI ${updateKPI}`);

      const updateKPIAchievement = await updateModuleinDB(ID, MysqlGetxAchievement, MODULE, mail);
      logger.debug(`updateCompany --> GETX KPI Achievement ${updateKPIAchievement}`);

      const updateSign = await updateModuleinDB(ID, MysqlGetxSign, MODULE, mail);
      logger.debug(`updateCompany --> GETX Sign ${updateSign}`);

      const updateAttach = await updateModuleinDB(ID, MysqlGetxAttachment, MODULE, mail);
      logger.debug(`updateCompany --> GETX Attachment ${updateAttach}`);

      const result2 = {
        ID,
        updated: result[0],
      };
      // console.dir(result2, { depth: null, colorized: true });
      logger.debug(`updateCompany --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateCompany --> by ${mail} completed`);

      return result2;
    }),
    unlistCompany: isAuthenticatedResolver.createResolver(async (parent, { ID }, {
      connectors: { MysqlSlvCompanyProfile },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`unlistCompany --> by ${mail} input: ${ID}`);
      checkPermission(unlistCompanyRule, userRoleList, userType, 'userReports');

      // search company
      const res = await MysqlSlvCompanyProfile.findById(ID);
      logger.debug(`unlistCompany --> company data found: ${res}`);

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
      logger.debug(`unlistCompany --> output: ${JSON.stringify(result2)}`);
      logger.info(`unlistCompany --> by ${mail} completed`);

      return result2;
    }),
  },
};
