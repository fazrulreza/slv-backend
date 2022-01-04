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
    allUserRole: isAuthenticatedResolver.createResolver(async (
      parent, param, {
        connectors: { MysqlSlvUserRole },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`allUserRole --> by ${mail} called with no input`);

      if (!checkPermission('ROLES-READ', userRoleList)) throw new ForbiddenError();
      logger.debug('allUserRole --> Permission check passed');

      // default to module view
      let where = { MODULE: { [Op.substring]: userRoleList.MODULE } };

      // check admin
      if (userRoleList.MODULE === 'ALL') {
        where = null;
      }

      const searchOpts = {
        where,
        order: [['MODULE'], ['NAME']],
      };
      const result = await MysqlSlvUserRole.findAll(searchOpts);
      const result2 = result.map((x) => processUserRolesOutput(x));

      logger.debug(`allUserRole --> output: ${JSON.stringify(result2)}`);
      logger.info(`allUserRole --> by ${mail} completed`);

      return result2;
    }),
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneUserRole: isAuthenticatedResolver.createResolver(async (
      parent, { ID }, {
        connectors: { MysqlSlvUserRole },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`oneUserRole --> by ${mail} input: ${ID}`);

      if (!checkPermission('ROLES-READ', userRoleList)) throw new ForbiddenError();
      logger.debug('oneUserRole --> Permission check passed');

      const searchOpts = {
        where: { ID },
      };
      const result = await MysqlSlvUserRole.findOne(searchOpts);
      const result2 = result ? processUserRolesOutput(result) : {};

      logger.debug(`oneUserRole --> output: ${JSON.stringify(result2)}`);
      logger.info(`oneUserRole --> by ${mail} completed`);
      return result2;
    }),
  },
  Mutation: {
    createUserRole: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvUserRole },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`createUserRole --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('ROLES-CREATE', userRoleList)) throw new ForbiddenError();
      logger.debug('createUserRole --> Permission check passed');

      // process input
      const processedInput = processInput(input.data);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...processedInput,
        ...history,
      };
        // console.log(newInput);
      const result = await MysqlSlvUserRole.create(newInput);

      logger.debug(`createUserRole --> output: ${JSON.stringify(result)}`);
      logger.info(`createUserRole --> by ${mail} completed`);

      return result;
    }),
    updateUserRole: isAuthenticatedResolver.createResolver(async (
      parent, { ID, input }, {
        connectors: { MysqlSlvUserRole },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`updateUserRole --> by ${mail} input for ${ID}: ${JSON.stringify(input)}`);

      if (!checkPermission('ROLES-UPDATE', userRoleList)) throw new ForbiddenError();
      logger.debug('updateUserRole --> Permission check passed');

      const processedInput = processInput(input.data);

      const history = generateHistory(mail, 'UPDATE', processedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...processedInput,
          ...history,
        },
        where: {
          ID,
        },
      };
      const result = await MysqlSlvUserRole.update(searchOpts);
      const result2 = {
        ID,
        updated: result[0],
      };

      logger.debug(`updateUserRole --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateUserRole --> by ${mail} completed`);

      return result2;
    }),
    deleteUserRole: isAuthenticatedResolver.createResolver(async (
      parent, { ID }, {
        connectors: { MysqlSlvUserRole },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`deleteUserRole --> by ${mail} input: ${ID}`);

      if (!checkPermission('ROLES-DELETE', userRoleList)) throw new ForbiddenError();
      logger.debug('deleteUserRole --> Permission check passed');

      // remove user
      const searchOpts = {
        where: { ID },
      };
      const result = await MysqlSlvUserRole.delete(searchOpts);

      const result2 = {
        ID,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      logger.debug(`deleteUserRole --> output: ${JSON.stringify(result2)}`);
      logger.info(`deleteUserRole --> by ${mail} completed`);

      return result2;
    }),
  },
};
