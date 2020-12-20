
const { oracleConnection, PROCUREMENT } = require('../../../config');
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
    procurement: async (parent, { id }) => {
      const searchOpts = {
        oracleConnection,
        table: PROCUREMENT,
        id,
      };
      const result = await findById(searchOpts);
      return result;
    },
    /**
     * Retrieve all
     * @param {Object} param0 main input object
     * @param {String} param0.size sme size
     */
    procurementList: async (parent, { where, limit }) => {
      const searchOpts = {
        oracleConnection,
        table: PROCUREMENT,
        field: '*',
        where,
        limit,
      };
      const result = await findAll(searchOpts);
      return result;
    },
    /**
     * Retrieve all ID
     * @param {Object} param0 main input object
     * @param {String} param0.size sme size
     */
    procurementID: async (parent) => {
      const searchOpts = {
        oracleConnection,
        table: PROCUREMENT,
        field: 'ID',
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
    addProcurement: async (parent, { input }) => {
      const searchOpts = {
        oracleConnection,
        table: PROCUREMENT,
        input,
        user: input.PERSON_IN_CHARGE,
      };
      const result = await addOne(searchOpts);
      return result;
    },
    /**
     * Update a record based on ID
     * @param {Object} param0 main input object
     * @param {String} param0.id ID
     * @param {String} param0.input Object containing updated data
     */
    updateProcurement: async (parent, { id, input }) => {
      const searchOpts = {
        oracleConnection,
        table: PROCUREMENT,
        input,
        user: input.PERSON_IN_CHARGE,
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
    deleteProcurement: async (parent, { id }) => {
      const where = { ID: id };
      const searchOpts = {
        oracleConnection,
        table: PROCUREMENT,
        where,
        id,
      };
      const result = await deleteOne(searchOpts);
      return result;
    },
  },
};
