const { generateHistory } = require('../../../packages/mysql-model');
const { checkPermission, hashPasswordAsync, processUserRolesOutput } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');
const logger = require('../../../packages/logger');

module.exports = {
  Query: {
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allUserPublic: isAuthenticatedResolver.createResolver(async (
      parent, param, {
        connectors: { MysqlSlvUserPublic, MysqlSlvUserRole },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`allUserPublic --> by ${mail} called with no input`);

      if (!checkPermission('USER-READ', userRoleList)) throw new ForbiddenError();
      logger.debug('allUserPublic --> Permission check passed');

      // user
      const searchOpts = {
        where: null,
        order: [['EMAIL']],
      };
      const resUser = await MysqlSlvUserPublic.findAll(searchOpts);
      logger.debug(`allUserPublic --> user found: ${JSON.stringify(resUser)}`);

      // roles
      const searchOptsRole = { where: null };
      const resUserRole = await MysqlSlvUserRole.findAll(searchOptsRole);
      const resultUserRole = resUserRole.map((y) => y.dataValues);
      logger.debug(`allUserPublic --> user roles found: ${JSON.stringify(resultUserRole)}`);

      const resultPreUser = resUser
        .map((x) => {
          const resU1 = x.dataValues;
          const resU2 = resultUserRole.filter((z) => z.ID === resU1.ROLE)[0];
          return {
            ...resU1,
            AVATAR: JSON.parse(resU1.AVATAR),
            USER_ROLE: resU2.NAME,
            MODULE: resU2.MODULE,
          };
        });
      logger.debug(`allUserPublic --> user with user roles found: ${JSON.stringify(resultPreUser)}`);

      const resultUser = userRoleList.MODULE === 'ALL'
        ? resultPreUser
        : resultPreUser.filter((w) => w.MODULE === userRoleList.MODULE);

      logger.debug(`allUserPublic --> filtered users found: ${JSON.stringify(resultUser)}`);
      logger.info(`allUserPublic --> by ${mail} completed`);

      return resultUser;
    }),
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneUserPublic: isAuthenticatedResolver.createResolver(async (
      parent, { email }, {
        connectors: { MysqlSlvUserPublic, MysqlSlvUserRole },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`oneUserPublic --> by ${mail} input: ${email}`);

      if (!checkPermission('USER-READ', userRoleList)) throw new ForbiddenError();
      logger.debug('oneUserPublic --> Permission check passed');

      // user
      const searchOpts = { where: { EMAIL: email } };
      const resUser = await MysqlSlvUserPublic.findOne(searchOpts);
      const resultUser = {
        ...resUser.dataValues,
        AVATAR: JSON.parse(resUser.dataValues.AVATAR),
      };
      logger.debug(`oneUserPublic --> user found: ${JSON.stringify(resultUser)}`);

      // roles
      const searchOptsRole = { where: null };
      const resUserRole = await MysqlSlvUserRole.findAll(searchOptsRole);
      const resultUserRole = resUserRole.map((x) => processUserRolesOutput(x));
      logger.debug(`oneUserPublic --> user roles found: ${JSON.stringify(resultUserRole)}`);

      const finalResult = {
        userPublicOne: resultUser,
        userRole: resultUserRole,
      };

      logger.debug(`oneUserPublic --> output: ${JSON.stringify(finalResult)}`);
      logger.info(`oneUserPublic --> by ${mail} completed`);

      return finalResult;
    }),
  },
  Mutation: {
    createUserPublic: isAuthenticatedResolver.createResolver(async (
      parent, { input }, { connectors: { MysqlSlvUserPublic }, user: { mail, userRoleList } },
    ) => {
      logger.info(`createUserPublic --> by ${mail} input: ${JSON.stringify(input)}`);

      if (!checkPermission('USER-CREATE', userRoleList)) throw new ForbiddenError();
      logger.debug('createUserPublic --> Permission check passed');

      // process input
      const parsedInput = JSON.parse(input.data);
      const newPwd = await hashPasswordAsync(parsedInput.PWD);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...parsedInput,
        AVATAR: JSON.stringify(parsedInput.AVATAR),
        SOURCE: 'PORTAL',
        PWD: newPwd,
        ...history,
      };
        // console.log(newInput);
      const result = await MysqlSlvUserPublic.create(newInput);

      logger.debug(`createUserPublic --> output: ${JSON.stringify(newInput)}`);
      logger.info(`createUserPublic --> by ${mail} completed`);

      return result;
    }),
    updateUserPublic: isAuthenticatedResolver.createResolver(async (
      parent, { email, input }, {
        connectors: { MysqlSlvUserPublic },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`updateUserPublic --> by ${mail} input for ${email}: ${JSON.stringify(input)}`);

      if (!checkPermission('USER-UPDATE', userRoleList)) throw new ForbiddenError();
      logger.debug('updateUserPublic --> Permission check passed');

      const parsedInput = JSON.parse(input.data);
      let newPwd = parsedInput.PWD;

      if (parsedInput.PWD_CHANGE_FLAG) {
        logger.debug(`updateUserPublic --> change password: ${parsedInput.PWD_CHANGE_FLAG}`);
        newPwd = await hashPasswordAsync(parsedInput.PWD);
      }

      const history = generateHistory(mail, 'UPDATE', parsedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...parsedInput,
          AVATAR: JSON.stringify(parsedInput.AVATAR),
          PWD: newPwd,
          ...history,
        },
        where: {
          EMAIL: email,
        },
      };
      const result = await MysqlSlvUserPublic.update(searchOpts);
      const result2 = {
        ID: email,
        updated: result[0],
      };
      logger.debug(`updateUserPublic --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateUserPublic --> by ${mail} completed`);

      return result2;
    }),
    deleteUserPublic: isAuthenticatedResolver.createResolver(async (
      parent, { email }, {
        connectors: { MysqlSlvUserPublic },
        user: { mail, userRoleList },
      },
    ) => {
      logger.info(`deleteUserPublic --> by ${mail} input: ${email}`);

      if (!checkPermission('USER-DELETE', userRoleList)) throw new ForbiddenError();
      logger.debug('deleteUserPublic --> Permission check passed');

      // remove user
      const searchOpts = {
        where: { EMAIL: email },
      };
      const result = await MysqlSlvUserPublic.delete(searchOpts);

      const result2 = {
        ID: email,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      logger.debug(`deleteUserPublic --> output: ${JSON.stringify(result2)}`);
      logger.info(`deleteUserPublic --> by ${mail} completed`);

      return result2;
    }),
  },
};
