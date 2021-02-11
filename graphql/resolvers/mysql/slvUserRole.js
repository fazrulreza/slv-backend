const { generateHistory } = require('../../../packages/mysql-model');

module.exports = {
  Query: {
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allUserRole: async (
      parent, { ID }, { connectors: { MysqlSlvUserRole } },
    ) => {
      const searchOpts = {
        where: null,
        order: [['USER']],
      };
      const result = await MysqlSlvUserRole.findAll(searchOpts);
      const result2 = result.map(x => x.dataValues);

      return result2;
    },
  },
  Mutation: {
    createUserRole: async (
      parent, { input }, { connectors: { MysqlSlvUserRole } }) => {
      // process input
      const parsedInput = JSON.parse(input.data);

      const history = generateHistory(input.name, 'CREATE');
      const newInput = {
        ...parsedInput,
        ...history,
      };
        // console.log(newInput);
      const result = await MysqlSlvUserRole.create(newInput);
      return result;
    },
    updateUserRole: async (
      parent, { USER, input }, { connectors: { MysqlSlvUserRole } }) => {
      const parsedInput = JSON.parse(input.data);

      const history = generateHistory(input.name, 'UPDATE');
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
    },
    deleteUserRole: async (
      parent, { USER }, { connectors: { MysqlSlvUserRole } },
    ) => {
      // remove user
      const searchOpts = {
        where: { USER },
      };
      const result = await MysqlSlvUserRole.delete(searchOpts);

      const result2 = {
        USER,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    },
  },
};
