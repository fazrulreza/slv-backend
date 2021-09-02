const { generateHistory } = require('../../../packages/mysql-model');
const { checkPermission } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');

module.exports = {
  Query: {
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allUser: isAuthenticatedResolver.createResolver(async (
      parent, param, {
        connectors: { MysqlSlvUser, MysqlSlvUserRole },
        user: { userRoleList },
      },
    ) => {
      if (!checkPermission('USER-READ', userRoleList)) throw new ForbiddenError();

      // user
      const searchOpts = {
        where: null,
        order: [['USER']],
      };
      const resUser = await MysqlSlvUser.findAll(searchOpts);

      // roles
      const searchOptsRole = { where: null };
      const resUserRole = await MysqlSlvUserRole.findAll(searchOptsRole);
      const resultUserRole = resUserRole.map((y) => y.dataValues);

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

      const resultUser = userRoleList.MODULE === 'ALL'
        ? resultPreUser
        : resultPreUser.filter((w) => w.MODULE === userRoleList.MODULE);

      return resultUser;
    }),
  },
  Mutation: {
    createUser: isAuthenticatedResolver.createResolver(async (
      parent, { input }, { connectors: { MysqlSlvUser }, user: { mail, userRoleList } },
    ) => {
      if (!checkPermission('USER-CREATE', userRoleList)) throw new ForbiddenError();

      // process input
      const parsedInput = JSON.parse(input.data);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...parsedInput,
        ...history,
      };
        // console.log(newInput);
      const result = await MysqlSlvUser.create(newInput);
      return result;
    }),
    updateUser: isAuthenticatedResolver.createResolver(async (
      parent, { USER, input }, {
        connectors: { MysqlSlvUser },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('USER-UPDATE', userRoleList)) throw new ForbiddenError();

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
      return result2;
    }),
    deleteUser: isAuthenticatedResolver.createResolver(async (
      parent, { USER }, {
        connectors: { MysqlSlvUser },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('USER-DELETE', userRoleList)) throw new ForbiddenError();

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
      return result2;
    }),
  },
};
