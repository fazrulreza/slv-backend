const {
  oracleConnection, KSRUSER,
} = require('../../../config');
const {
  findById, findAll, addOne, updateOne, deleteOne,
} = require('../../../packages/oracle-model');

module.exports = {
  Query: {
    /**
     * Retrieve data based on ID
     * @param {Object} param0 main input object
     * @param {String} param0.id ID
     */
    ksrUser: async (parent, { id }) => {
      const searchOpts = {
        oracleConnection,
        table: KSRUSER,
        id,
      };
      const result = await findById(searchOpts);
      // console.log(result);

      return result;
    },
    /**
     * Retrieve all
     * @param {Object} param0 main input object
     * @param {String} param0.size sme size
     */
    ksrUserList: async (parent, {
      where, offset, limit, order,
    }) => {
      const searchOpts = {
        oracleConnection,
        table: KSRUSER,
        field: '*',
        where,
        offset,
        limit,
        order,
      };
      const result = await findAll(searchOpts);

      return result;
    },
  },
  Mutation: {
    /**
     * Insert a record
     * @param {Object} param0 main input object
     * @param {String} param0.input Object containing input data
     */
    addKSRUser: async (parent, { input }) => {
      const {
        MAIL, USER_TYPE, NAME, ADDER,
      } = input;
      const newInput = {
        MAIL,
        USER_TYPE,
        NAME,
      };
      const searchOpts = {
        oracleConnection,
        table: KSRUSER,
        input: newInput,
        user: ADDER,
      };
      const result = await addOne(searchOpts);
      // console.log(result);
      return result;
    },
    /**
     * Update a record based on ID
     * @param {Object} param0 main input object
     * @param {String} param0.id ID
     * @param {String} param0.input Object containing updated data
     */
    updateKSRUser: async (parent, { id, input }) => {
      const {
        MAIL, USER_TYPE, NAME, ADDER,
      } = input;
      const newInput = {
        MAIL,
        USER_TYPE,
        NAME,
      };

      const searchOpts = {
        oracleConnection,
        table: KSRUSER,
        input: newInput,
        user: ADDER,
        id,
      };
      const result = await updateOne(searchOpts);
      return result;
    },
    /**
     * Delete a record based on ID
     * @param {Object} param0 main input object
     * @param {String} param0.id ID
     */
    deleteKSRUser: async (parent, { id }) => {
      // delete Listing
      const where = { ID: id };
      const searchOpts = {
        oracleConnection,
        table: KSRUSER,
        where,
        id,
      };
      const result = await deleteOne(searchOpts);
      return result;
    },
  },
};
