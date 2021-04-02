const { generateHistory } = require('../../../packages/mysql-model');
const { userResolver } = require('../../permissions/acl');

module.exports = {
  Query: {
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allUserRole: userResolver.createResolver(async (
      parent, param, { connectors: { MysqlSlvUserRole } },
    ) => {
      const searchOpts = {
        where: null,
        order: [['USER']],
      };
      const result = await MysqlSlvUserRole.findAll(searchOpts);
      const result2 = result.map(x => x.dataValues);

      return result2;
    }),
  },
  Mutation: {
    createUserRole: userResolver.createResolver(async (
      parent, { input }, { connectors: { MysqlSlvUserRole }, user: usr }) => {
      // process input
      const parsedInput = JSON.parse(input.data);

      const history = generateHistory(usr.mail, 'CREATE');
      const newInput = {
        ...parsedInput,
        ...history,
      };
        // console.log(newInput);
      const result = await MysqlSlvUserRole.create(newInput);
      return result;
    }),
    updateUserRole: userResolver.createResolver(async (
      parent, { USER, input }, { connectors: { MysqlSlvUserRole }, user: usr }) => {
      const parsedInput = JSON.parse(input.data);

      const history = generateHistory(usr.mail, 'UPDATE');
      const searchOpts = {
        object: {
          ...parsedInput,
          ...history,
        },
        where: {
          USER,
        },
      };
      const result = await MysqlSlvUserRole.update(searchOpts);
      const result2 = {
        ID: USER,
        updated: result[0],
      };
      return result2;
    }),
    deleteUserRole: async (
      parent, { USER }, { connectors: { MysqlSlvUserRole } },
    ) => {
      // remove user
      const searchOpts = {
        where: { USER },
      };
      const result = await MysqlSlvUserRole.delete(searchOpts);

      const result2 = {
        ID: USER,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    },
  },
};
