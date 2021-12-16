const { generateHistory } = require('../../../packages/mysql-model');
const { checkPermission, hashPasswordAsync, processUserRolesOutput } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');

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
        user: { userRoleList },
      },
    ) => {
      if (!checkPermission('USER-READ', userRoleList)) throw new ForbiddenError();

      // user
      const searchOpts = {
        where: null,
        order: [['EMAIL']],
      };
      const resUser = await MysqlSlvUserPublic.findAll(searchOpts);

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
            AVATAR: JSON.parse(resU1.AVATAR),
            USER_ROLE: resU2.NAME,
            MODULE: resU2.MODULE,
          };
        });

      const resultUser = userRoleList.MODULE === 'ALL'
        ? resultPreUser
        : resultPreUser.filter((w) => w.MODULE === userRoleList.MODULE);

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
        user: { userRoleList },
      },
    ) => {
      if (!checkPermission('USER-READ', userRoleList)) throw new ForbiddenError();

      // user
      const searchOpts = { where: { EMAIL: email } };
      const resUser = await MysqlSlvUserPublic.findOne(searchOpts);
      const resultUser = {
        ...resUser.dataValues,
        AVATAR: JSON.parse(resUser.dataValues.AVATAR),
      };

      // roles
      const searchOptsRole = { where: null };
      const resUserRole = await MysqlSlvUserRole.findAll(searchOptsRole);
      const resultUserRole = resUserRole.map((x) => processUserRolesOutput(x));

      const finalResult = {
        userPublicOne: resultUser,
        userRole: resultUserRole,
      };

      return finalResult;
    }),
  },
  Mutation: {
    createUserPublic: isAuthenticatedResolver.createResolver(async (
      parent, { input }, { connectors: { MysqlSlvUserPublic }, user: { mail, userRoleList } },
    ) => {
      if (!checkPermission('USER-CREATE', userRoleList)) throw new ForbiddenError();

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
      return result;
    }),
    updateUserPublic: isAuthenticatedResolver.createResolver(async (
      parent, { email, input }, {
        connectors: { MysqlSlvUserPublic },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('USER-UPDATE', userRoleList)) throw new ForbiddenError();

      const parsedInput = JSON.parse(input.data);
      let newPwd = parsedInput.PWD;

      if (parsedInput.PWD_CHANGE_FLAG) newPwd = await hashPasswordAsync(parsedInput.PWD);

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
      return result2;
    }),
    deleteUserPublic: isAuthenticatedResolver.createResolver(async (
      parent, { email }, {
        connectors: { MysqlSlvUserPublic },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('USER-DELETE', userRoleList)) throw new ForbiddenError();

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
      return result2;
    }),
  },
};
