const { Op } = require('sequelize');
const { generateHistory } = require('../../../packages/mysql-model');
const { processUserRolesOutput, checkPermission } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');
const logger = require('../../../packages/logger');

const processInput = (data) => {
  const parsedInput = JSON.parse(data);
  const processedInput = {
    ...parsedInput,
    NAME: parsedInput.NAME.toUpperCase(),
    COMPANY_MODULE: parsedInput.COMPANY_MODULE ? JSON.stringify(parsedInput.COMPANY_MODULE) : '[]',
    SURVEY_MODULE: parsedInput.SURVEY_MODULE ? JSON.stringify(parsedInput.SURVEY_MODULE) : '[]',
    ASSESSMENT_MODULE: parsedInput.ASSESSMENT_MODULE ? JSON.stringify(parsedInput.ASSESSMENT_MODULE) : '[]',
    USER_MODULE: parsedInput.USER_MODULE ? JSON.stringify(parsedInput.USER_MODULE) : '[]',
    ROLES_MODULE: parsedInput.ROLES_MODULE ? JSON.stringify(parsedInput.ROLES_MODULE) : '[]',
    GETX_MODULE: parsedInput.GETX_MODULE ? JSON.stringify(parsedInput.GETX_MODULE) : '[]',
    ELSA_MODULE: parsedInput.ELSA_MODULE ? JSON.stringify(parsedInput.ELSA_MODULE) : '[]',
    MODULE_MODULE: parsedInput.MODULE_MODULE ? JSON.stringify(parsedInput.MODULE_MODULE) : '[]',
  };
  return processedInput;
};

module.exports = {
  Query: {
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allModuls: isAuthenticatedResolver.createResolver(async (
      parent, param, {
        connectors: { MysqlSlvModule },
        user: { mail, userRoleList, userType },
      },
    ) => {
      logger.info(`allModuls --> by ${mail} called with no input`);

      if (!checkPermission('MODULE-READ', userRoleList)) {
        logger.error('allModuls --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('allModuls --> Permission check passed');

      // default to module view
      let where = { MODULE: { [Op.substring]: userRoleList.MODULE } };

      // check admin
      if (userRoleList.MODULE === 'SME' && userType === 1) {
        where = null;
      }

      const searchOpts = {
        where,
        order: [['NAME']],
      };
      const result = await MysqlSlvModule.findAll(searchOpts);

      logger.debug(`allModuls --> output: ${JSON.stringify(result)}`);
      logger.info(`allModuls --> by ${mail} completed`);

      return result;
    }),
  },
  Mutation: {
    createModul: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvModule },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`createModul --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('MODULE-CREATE', userRoleList)) {
        logger.error('createModul --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('createModul --> Permission check passed');

      // process input
      const processedInput = JSON.parse(input.data);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...processedInput,
        ...history,
      };
        // console.log(newInput);
      const result = await MysqlSlvModule.create(newInput);

      logger.debug(`createModul --> output: ${JSON.stringify(result)}`);
      logger.info(`createModul --> by ${mail} completed`);

      return result;
    }),
    updateModul: isAuthenticatedResolver.createResolver(async (
      parent, { NAME, input }, {
        connectors: { MysqlSlvModule },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`updateModul --> by ${mail} input for ${NAME}: ${JSON.stringify(input)}`);

      if (!checkPermission('MODULE-UPDATE', userRoleList)) {
        logger.error('updateModul --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('updateModul --> Permission check passed');

      const processedInput = JSON.parse(input.data);

      const history = generateHistory(mail, 'UPDATE', processedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...processedInput,
          ...history,
        },
        where: {
          NAME,
        },
      };
      const result = await MysqlSlvModule.update(searchOpts);
      const result2 = {
        NAME,
        updated: result[0],
      };

      logger.debug(`updateModul --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateModul --> by ${mail} completed`);

      return result2;
    }),
    deleteModul: isAuthenticatedResolver.createResolver(async (
      parent, { NAME }, {
        connectors: { MysqlSlvModule },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`deleteModul --> by ${mail} input: ${NAME}`);

      if (!checkPermission('MODULE-DELETE', userRoleList)) {
        logger.error('deleteModul --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('deleteModul --> Permission check passed');

      // remove user
      const searchOpts = {
        where: { NAME },
      };
      const result = await MysqlSlvModule.delete(searchOpts);

      const result2 = {
        NAME,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      logger.debug(`deleteModul --> output: ${JSON.stringify(result2)}`);
      logger.info(`deleteModul --> by ${mail} completed`);

      return result2;
    }),
  },
};
