const { generateHistory } = require('../../../packages/mysql-model');
const { checkPermission } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const logger = require('../../../packages/logger');
const {
  allUserRule, createUserRule, updateUserRule, deleteUserRule,
} = require('../../permissions/rule');

module.exports = {
  Query: {
    /**
     * Retrieve all
     * @param {Object} param0 main input object
     * @param {String} param0.id id
     */
    allUser: isAuthenticatedResolver.createResolver(async (parent, param, {
      connectors: { MysqlSlvUser, MysqlSlvUserRole },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`allUser --> by ${mail} called with no input`);
      checkPermission(allUserRule, userRoleList, userType, 'allUser');

      // user
      const searchOpts = {
        where: null,
        order: [['USER']],
      };
      const resUser = await MysqlSlvUser.findAll(searchOpts);
      logger.debug(`allUser --> user found: ${JSON.stringify(resUser)}`);

      // roles
      const searchOptsRole = { where: null };
      const resUserRole = await MysqlSlvUserRole.findAll(searchOptsRole);
      const resultUserRole = resUserRole.map((y) => y.dataValues);
      logger.debug(`allUser --> user roles found: ${JSON.stringify(resultUserRole)}`);

      const resultPreUser = resUser
        .map((x) => {
          const resU1 = x.dataValues;
          const resU2 = resultUserRole.filter((z) => z.ID === resU1.ROLE)[0];
          return {
            ...resU1,
            USER_ROLE: resU2.NAME,
            MODULE: resU2.MODULE,
          };
        });
      logger.debug(`allUser --> user with user roles found: ${JSON.stringify(resultPreUser)}`);

      const resultUser = userRoleList.MODULE === 'SME' && userType === 1
        ? resultPreUser
        : resultPreUser.filter((w) => w.MODULE === userRoleList.MODULE);

      logger.debug(`allUser --> filtered users found: ${JSON.stringify(resultUser)}`);
      logger.info(`allUser --> by ${mail} completed`);

      return resultUser;
    }),
  },
  Mutation: {
    createUser: isAuthenticatedResolver.createResolver(async (
      parent,
      { input },
      { connectors: { MysqlSlvUser }, user: { mail, userRoleList, userType } },
    ) => {
      logger.info(`createUser --> by ${mail} input: ${JSON.stringify(input)}`);
      checkPermission(createUserRule, userRoleList, userType, 'createUser');

      // process input
      const parsedInput = JSON.parse(input.data);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...parsedInput,
        ...history,
      };
        // console.log(newInput);
      const result = await MysqlSlvUser.create(newInput);

      logger.debug(`createUser --> output: ${JSON.stringify(result)}`);
      logger.info(`createUser --> by ${mail} completed`);

      return result;
    }),
    updateUser: isAuthenticatedResolver.createResolver(async (parent, { USER, input }, {
      connectors: { MysqlSlvUser },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`updateUser --> by ${mail} input for ${USER}: ${JSON.stringify(input)}`);
      checkPermission(updateUserRule, userRoleList, userType, 'updateUser');

      const parsedInput = JSON.parse(input.data);

      const history = generateHistory(mail, 'UPDATE', parsedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...parsedInput,
          ...history,
        },
        where: {
          USER,
        },
      };
      const result = await MysqlSlvUser.update(searchOpts);
      const result2 = {
        ID: USER,
        updated: result[0],
      };
      logger.debug(`updateUser --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateUser --> by ${mail} completed`);

      return result2;
    }),
    deleteUser: isAuthenticatedResolver.createResolver(async (parent, { USER }, {
      connectors: { MysqlSlvUser },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`deleteUser --> by ${mail} input: ${USER}`);
      checkPermission(deleteUserRule, userRoleList, userType, 'deleteUser');

      // remove user
      const searchOpts = {
        where: { USER },
      };
      const result = await MysqlSlvUser.delete(searchOpts);

      const result2 = {
        ID: USER,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      logger.debug(`deleteUser --> output: ${JSON.stringify(result2)}`);
      logger.info(`deleteUser --> by ${mail} completed`);

      return result2;
    }),
  },
};
