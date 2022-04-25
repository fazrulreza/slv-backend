const moment = require('moment');
const { generateId, generateHistory } = require('../../../packages/mysql-model');
const {
  checkPermission, getRoleWhere, getCurrentData, getFilteredData,
} = require('../../helper/common');
const { stateList, requiredCompanyFields } = require('../../helper/parameter');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const {
  ForbiddenError, InvalidDataError, CompanyExistsError, DataTooLongError,
} = require('../../permissions/errors');
const logger = require('../../../packages/logger');

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
  const resultCompany = resCompany ? resCompany.dataValues.ENTITY_NAME : 'N/A';

  if (resultCompany === 'N/A'
    && process !== 'checkCompany'
    && (ID === 'new'
    || (ID !== 'new' && resultCompany.ID !== ID))) {
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
    oneCompany: isAuthenticatedResolver.createResolver(async (
      parent, { ID }, {
        connectors: { MysqlSlvCompanyProfile, MysqlSlvMSIC },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`oneCompany --> by ${mail} input: ${ID}`);

      if (!checkPermission('COMPANY-READ', userRoleList)) {
        logger.error('oneCompany --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('oneCompany --> Permission check passed');

      const searchOpts = {
        where: null,
        order: [['MSIC']],
      };
      const result = await MysqlSlvMSIC.findAll(searchOpts);
      const result2 = result.map((x) => x.dataValues);
      logger.debug('oneCompany --> MSIC data found');

      const res = await MysqlSlvCompanyProfile.findById(ID);
      if (!res) {
        logger.error(`oneCompany --> No record found for ${ID}`);
        throw new Error(`No record found with for ${ID}`);
      }
      const newCompany = {
        ...res.dataValues,
        LOGO: JSON.parse(res.dataValues.LOGO),
      };
      logger.debug(`oneCompany --> Company data found: ${JSON.stringify(newCompany)}`);

      const finalResult = {
        allMSIC: result2,
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
    allCompanies: isAuthenticatedResolver.createResolver(async (
      parent, { filter }, {
        connectors: {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment, MysqlGetxKPI,
        },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`allCompanies --> by ${mail} called with no input`);

      if (!checkPermission('COMPANY-READ', userRoleList)) {
        logger.error('allCompanies --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('allCompanies --> Permission check passed');

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
      const resultQuest = await getCurrentData(
        MysqlSlvSurvey, searchOptsAll, 'allCompanies', 'survey',
      );

      // assessment
      const resultScore = await getCurrentData(
        MysqlSlvAssessment, searchOptsAll, 'allCompanies', 'assessment',
      );

      // getx
      const resultKPI = await getCurrentData(
        MysqlGetxKPI, searchOptsAll, 'allCompanies', 'getx',
      );

      const resCompany = await MysqlSlvCompanyProfile.findAll(searchOpts);
      logger.debug(`allCompanies --> total company found: ${resultCompany.length}`);

      // compile result
      resultCompany = resCompany.map((x) => {
        const resC = x.dataValues;
        const resC1 = {
          ...resC,
          LOGO: JSON.parse(resC.LOGO),
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
          ...resC1,
          ...resQ1,
          ...resS1,
          ...resK1,
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
    userReports: isAuthenticatedResolver.createResolver(async (
      parent, param, {
        connectors: {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment,
          MysqlSlvUser, MysqlSlvUserRole,
        },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`userReports --> by ${mail} called with no input`);
      if (!checkPermission('COMPANY-READ', userRoleList)) {
        logger.error('userReports --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('userReports --> Permission check passed');

      const where = getRoleWhere(userRoleList, mail);
      logger.debug(`userReports --> search criteria: ${JSON.stringify(where)}`);
      const searchOpts = { where };

      // user
      const searchOptsUser = {
        where,
        order: [['USER']],
      };
      const resUser = await MysqlSlvUser.findAll(searchOptsUser);
      const resultUser = resUser.map((x) => x.dataValues);
      logger.debug(`userReports --> total user: ${resultUser.length}`);

      // user role
      const resultUserRole = await MysqlSlvUserRole.findAll(searchOpts);
      logger.debug(`userReports --> total user roles found: ${resultUserRole.length}`);

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
    stateReports: isAuthenticatedResolver.createResolver(async (
      parent, { filter }, {
        connectors: { MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`stateReports --> by ${mail} called with filter ${JSON.stringify(filter)}`);

      if (!checkPermission('COMPANY-READ', userRoleList)) {
        logger.error('stateReports --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('stateReports --> Permission check passed');

      let resultCompany = [];

      const where = getRoleWhere(userRoleList, mail);
      logger.debug(`stateReports --> search criteria: ${JSON.stringify(where)}`);
      const searchOpts = { where };
      const searchOptsAll = { where: null };

      // Survey
      const resultQuest = await getCurrentData(
        MysqlSlvSurvey, searchOptsAll, 'stateReports', 'survey',
      );

      // Assessment
      const resultScore = await getCurrentData(
        MysqlSlvAssessment, searchOptsAll, 'stateReports', 'assessment',
      );

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
            ...resC,
            ...resQ1,
            ...resS1,
          };
        })
        .filter((cls) => cls.SME_CLASS && cls.SME_CLASS !== 'LARGE ENTERPRISE' && cls.SME_CLASS !== 'N/A')
        .filter((as) => as.OH_OPERATING_HISTORY);

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
      parent, { NAME }, { connectors: { MysqlSlvCompanyProfile }, user: { mail, userRoleList } },
    ) => {
      logger.info(`checkCompany --> by ${mail} input: ${NAME}`);

      if (!checkPermission('COMPANY-READ', userRoleList)) {
        logger.error('checkCompany --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('checkCompany --> Permission check passed');

      const result = checkCompanyExist(NAME, MysqlSlvCompanyProfile, 'checkCompany');

      logger.debug(`checkCompany --> input: ${result}`);
      logger.info(`checkCompany --> by ${mail} completed`);

      return result;
    }),
    createCompany: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvCompanyProfile, MysqlSlvUserPublic, MysqlSlvMSIC },
        user: { mail, userRoleList, userType },
      },
    ) => {
      logger.info(`createCompany --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('COMPANY-CREATE', userRoleList)) {
        logger.error('createCompany --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('createCompany --> Permission check passed');

      const parsedInput = JSON.parse(input.data);
      checkCompanyDetails(parsedInput);

      // check for company
      checkCompanyExist(parsedInput.ENTITY_NAME, MysqlSlvCompanyProfile, 'createCompany');

      // check for MSIC
      const MSICObject = await checkValidSection(
        parsedInput.SECTION, MysqlSlvMSIC, 'createCompany',
      );

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...parsedInput,
        LOGO: JSON.stringify(parsedInput.LOGO),
        ID: generateId(),
        MODULE: userRoleList.MODULE === 'ALL' ? 'SME' : userRoleList.MODULE,
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
    deleteCompany: isAuthenticatedResolver.createResolver(async (
      parent, { ID }, {
        connectors: {
          MysqlSlvCompanyProfile, MysqlSlvSurvey, MysqlSlvAssessment, MysqlSlvELSAScorecard,
          MysqlGetxKPI, MysqlGetxSign, MysqlGetxAttachment,
        },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`deleteCompany --> by ${mail} input: ${ID}`);

      if (!checkPermission('COMPANY-DELETE', userRoleList)) {
        logger.error('deleteCompany --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('deleteCompany --> Permission check passed');

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
    updateCompany: isAuthenticatedResolver.createResolver(async (
      parent, { ID, input }, {
        connectors: { MysqlSlvCompanyProfile, MysqlSlvMSIC },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`updateCompany --> by ${mail} input ${ID}: ${input}`);

      if (!checkPermission('COMPANY-UPDATE', userRoleList)) {
        logger.error('updateCompany --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('updateCompany --> Permission check passed');

      const parsedInput = JSON.parse(input.data);
      checkCompanyDetails(parsedInput);

      // check for company
      checkCompanyExist(parsedInput.ENTITY_NAME, MysqlSlvCompanyProfile, 'updateCompany', ID);

      // check for MSIC
      const MSICObject = await checkValidSection(
        parsedInput.SECTION, MysqlSlvMSIC, 'createCompany',
      );

      const history = generateHistory(mail, 'UPDATE', parsedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...parsedInput,
          LOGO: JSON.stringify(parsedInput.LOGO),
          ...MSICObject,
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
      logger.debug(`updateCompany --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateCompany --> by ${mail} completed`);

      return result2;
    }),
    unlistCompany: isAuthenticatedResolver.createResolver(async (
      parent, { ID }, {
        connectors: { MysqlSlvCompanyProfile },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`unlistCompany --> by ${mail} input: ${ID}`);

      if (!checkPermission('GETX-DELETE', userRoleList)) {
        logger.error('unlistCompany --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('unlistCompany --> Permission check passed');

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
