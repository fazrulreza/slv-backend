const { generateHistory } = require('../../../packages/mysql-model');
const { processUserRolesOutput, checkPermission } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError } = require('../../permissions/errors');

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
        connectors: { FileSlvUserRole },
        user: { userRoleList },
      },
    ) => {
      if (!checkPermission('ROLES-READ', userRoleList)) throw new ForbiddenError();

      const where = userRoleList.MODULE === 'ALL' ? null : { MODULE: userRoleList.MODULE };

      const searchOpts = {
        where,
        order: [['MODULE'], ['NAME']],
      };
      const result = await FileSlvUserRole.findAll(searchOpts);
      const result2 = result.map((x) => processUserRolesOutput(x));

      return result2;
    }),
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneUserRole: isAuthenticatedResolver.createResolver(async (
      parent, { ID }, {
        connectors: { FileSlvUserRole },
        user: { userRoleList },
      },
    ) => {
      if (!checkPermission('ROLES-READ', userRoleList)) throw new ForbiddenError();

      const searchOpts = {
        where: { ID },
      };
      const result = await FileSlvUserRole.findOne(searchOpts);
      const result2 = result ? processUserRolesOutput(result) : {};

      return result2;
    }),
  },
  Mutation: {
    createUserRole: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { FileSlvUserRole },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('ROLES-CREATE', userRoleList)) throw new ForbiddenError();

      // process input
      const processedInput = processInput(input.data);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...processedInput,
        ...history,
      };
        // console.log(newInput);
      const result = await FileSlvUserRole.create(newInput);
      return result;
    }),
    updateUserRole: isAuthenticatedResolver.createResolver(async (
      parent, { ID, input }, {
        connectors: { FileSlvUserRole },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('ROLES-UPDATE', userRoleList)) throw new ForbiddenError();

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
      const result = await FileSlvUserRole.update(searchOpts);
      const result2 = {
        ID,
        updated: result[0],
      };
      return result2;
    }),
    deleteUserRole: isAuthenticatedResolver.createResolver(async (
      parent, { ID }, {
        connectors: { FileSlvUserRole },
        user: { mail, userRoleList },
      },
    ) => {
      if (!checkPermission('ROLES-DELETE', userRoleList)) throw new ForbiddenError();
      // remove user
      const searchOpts = {
        where: { ID },
      };
      const result = await FileSlvUserRole.delete(searchOpts);

      const result2 = {
        ID,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    }),
  },
};
