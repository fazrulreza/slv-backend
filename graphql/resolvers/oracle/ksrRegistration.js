
const { oracleConnection, KSRREGISTRATION } = require('../../../config');
const {
  findById, findAll, updateMany, generateId, addMany, deleteOne,
} = require('../../../packages/oracle-model');

module.exports = {
  Query: {
    /**
     * Retrieve data based on ID
     * @param {Object} param0 main input object
     * @param {String} param0.id ID
     */
    ksrRegistration: async (parent, { id }) => {
      const searchOpts = {
        oracleConnection,
        table: KSRREGISTRATION,
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
    ksrRegistrationList: async (parent, { where, limit, offset }) => {
      const searchOpts = {
        oracleConnection,
        table: KSRREGISTRATION,
        field: '*',
        where,
        limit,
        offset,
      };
      const result = await findAll(searchOpts);
      // console.log(result);

      // get unique
      const regID = result.map(x => x.REGISTRATION_ID);
      const uniqRegID = [...new Set(regID)];

      // map fields to reg ID
      const result2 = uniqRegID.map((y) => {
        let obj = {};
        const filtered = result.filter(a => a.REGISTRATION_ID === y);
        const sortOrder = ['NAME', 'EMAIL', 'PHONE', 'MOBILE', 'DEPARTMENT', 'DETAILS'];
        const part2 = filtered.sort((a, b) => sortOrder.indexOf(a.FIELD) - sortOrder.indexOf(b.FIELD));
        const part1 = part2.splice(part2.length - sortOrder.length, part2.length);
        const sortedResult = part1.concat(part2);
        sortedResult.map((z) => {
          obj = {
            ...obj,
            [z.FIELD]: z.VALUE,
          };
          return 0;
        });
        const final = {
          REGISTRATION_ID: y,
          FIELD: JSON.stringify({ ...obj }),
        };
        return final;
      });
      // console.log(result2);
      return result2;
    },
    /**
     * Retrieve all ID
     * @param {Object} param0 main input object
     * @param {String} param0.size sme size
     */
    ksrRegistrationID: async (parent) => {
      const searchOpts = {
        oracleConnection,
        table: KSRREGISTRATION,
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
    addKsrRegistration: async (parent, { input }) => {
      const emailInput = input.INPUT_FIELD.filter(x => x.FIELD === 'EMAIL');
      const email = emailInput[0].VALUE;

      // restructure
      const REGISTRATION_ID = generateId();
      const newInput = input.INPUT_FIELD.map(x => ({
        KSR_ID: input.KSR_ID,
        REGISTRATION_ID,
        ...x,
      }));
      // console.log(newInput);

      const searchOpts = {
        oracleConnection,
        table: KSRREGISTRATION,
        input: newInput,
        user: email,
      };
      const result = await addMany(searchOpts);
      const finalResult = {
        ...result,
        id: REGISTRATION_ID,
      };
      return finalResult;
    },
    /**
     * Update a record based on ID
     * @param {Object} param0 main input object
     * @param {String} param0.id ID
     * @param {String} param0.input Object containing updated data
     */
    updateKsrRegistration: async (parent, { input }) => {
      // console.log(input);

      let addResult = {};
      let updateResult = {};

      const { REGISTRATION_ID, KSR_ID, INPUT_FIELD } = input;
      const where = JSON.stringify({
        REGISTRATION_ID,
      });
      const searchOpts = {
        oracleConnection,
        table: KSRREGISTRATION,
        field: '*',
        where,
      };
      const exist = await findAll(searchOpts);
      const user = exist[0].CREATED_BY;

      // newly added
      const newEntry = INPUT_FIELD.filter(x => x.FORM_ID === '');
      if (newEntry.length !== 0) {
        const newInput = newEntry.map((x) => {
          const { FIELD, VALUE } = x;
          return {
            FIELD,
            VALUE,
            KSR_ID,
            REGISTRATION_ID,
          };
        });
        // console.log(newInput);
        const searchOptsAdd = {
          oracleConnection,
          table: KSRREGISTRATION,
          input: newInput,
          user,
        };
        addResult = await addMany(searchOptsAdd);
      }

      // to be updated
      const updateEntry = INPUT_FIELD.filter((x) => {
        const existed = exist.filter(y => (y.ID === x.FORM_ID) && (y.VALUE !== x.VALUE));
        return existed.length !== 0;
      });
      // console.log(updateEntry);
      if (updateEntry.length !== 0) {
        const updateInput = updateEntry.map((z) => {
          const { FIELD, VALUE, FORM_ID } = z;
          return {
            FIELD,
            VALUE,
            ID: FORM_ID,
          };
        });

        const searchOptsUpdate = {
          oracleConnection,
          table: KSRREGISTRATION,
          input: updateInput,
          user,
        };
        updateResult = await updateMany(searchOptsUpdate);
      }

      const result = {
        addResult,
        updateResult,
        id: REGISTRATION_ID,
      };

      return result;
    },
    /**
     * Delete a record based on ID
     * @param {Object} param0 main input object
     * @param {String} param0.id ID
     */
    deleteKsrRegistration: async (parent, { id }) => {
      const where = { REGISTRATION_ID: id };
      const searchOpts = {
        oracleConnection,
        table: KSRREGISTRATION,
        id,
        where,
      };
      const result = await deleteOne(searchOpts);
      return result;
    },
  },
};
