const {
  oracleConnection, KSR, KSRFORM, KSRREGISTRATION,
} = require('../../../config');
const {
  findById, findAll, addOne, updateOne, deleteOne, count, addMany,
} = require('../../../packages/oracle-model');

module.exports = {
  Query: {
    /**
     * Retrieve data based on ID
     * @param {Object} param0 main input object
     * @param {String} param0.id ID
     */
    ksr: async (parent, { id }) => {
      const searchOpts = {
        oracleConnection,
        table: KSR,
        id,
      };
      const result = await findById(searchOpts);
      // console.log(result);
      const increaseHit = result.HITS + 1;
      const newInput = {
        HITS: increaseHit,
      };

      // update Hits
      const updateOpts = {
        ...searchOpts,
        input: newInput,
        user: result.UPDATED_BY,
        noDateChange: true,
      };
      const result2 = await updateOne(updateOpts);

      // get Registered user in list
      const countOpts = {
        oracleConnection,
        table: KSRREGISTRATION,
        where: JSON.stringify({ KSR_ID: id }),
        group: 'KSR_ID, REGISTRATION_ID',
      };
      const countResult = await count(countOpts);

      const finalResult = {
        ...result,
        ...newInput,
        COUNT: countResult.length === 0 ? 0 : countResult.length,
      };

      return finalResult;
    },
    /**
     * Retrieve all
     * @param {Object} param0 main input object
     * @param {String} param0.size sme size
     */
    ksrList: async (parent, {
      where, offset, limit, order, countFlag = false,
    }) => {
      const searchOpts = {
        oracleConnection,
        table: KSR,
        field: '*',
        where,
        offset,
        limit,
        order,
      };
      const listing = await findAll(searchOpts);
      let result = listing;

      if (countFlag) {
        const countOpts = {
          oracleConnection,
          table: KSRREGISTRATION,
          group: 'KSR_ID, REGISTRATION_ID',
        };

        const countResult = await count(countOpts);
        result = listing.map((x) => {
          const match = countResult.filter(y => y.KSR_ID === x.ID);
          return {
            ...x,
            COUNT: match.length === 0 ? 0 : match.length,
          };
        });
      }

      return result;
    },
    /**
     * Retrieve all with pagination
     * @param {Object} param0 main input object
     * @param {String} param0.size sme size
     */
    ksrListPagination: async (parent, {
      where, currentPage = 1, pageSize = 6, order, countFlag = false,
    }) => {
      const offset = (currentPage - 1) * pageSize;
      const limit = pageSize;
      // console.log(where);

      const searchOpts = {
        oracleConnection,
        table: KSR,
        field: '*',
        where,
        offset,
        limit,
        order,
      };
      const listing = await findAll(searchOpts);

      // pagination
      const page = await count(searchOpts);
      const pagination = {
        maxPage: Math.ceil(page[0].COUNT / pageSize),
        currentPage,
      };

      let result = listing;
      if (countFlag) {
        const countOpts = {
          oracleConnection,
          table: KSRREGISTRATION,
          group: 'KSR_ID, REGISTRATION_ID',
        };

        const countResult = await count(countOpts);
        result = listing.map((x) => {
          const match = countResult.filter(y => y.KSR_ID === x.ID);
          return {
            ...x,
            COUNT: match.length === 0 ? 0 : match.length,
          };
        });
      }
      const finalResult = {
        pagination,
        result,
      };
      return finalResult;
    },
  },
  Mutation: {
    /**
     * Insert a record
     * @param {Object} param0 main input object
     * @param {String} param0.input Object containing input data
     */
    addKSR: async (parent, { input }) => {
      const {
        TITLE, CONTENT, NAME, REGISTER, LIMIT, START_DATE, END_DATE, TYPE,
      } = input;
      const newInput = {
        TITLE,
        TYPE,
        CONTENT,
        REGISTER,
        LIMIT,
        START_DATE: new Date(`${START_DATE} 08:00`),
        END_DATE: new Date(`${END_DATE} 08:00`),
      };
      const searchOpts = {
        oracleConnection,
        table: KSR,
        input: newInput,
        user: NAME,
      };
      const result = await addOne(searchOpts);

      if (REGISTER === 1) {
        // add default questions
        const newForm = [
          {
            TYPE: 'input',
            VALIDATION: 'text',
            QUESTION: 'NAME',
            REQUIRED: 1,
          },
          {
            TYPE: 'input',
            VALIDATION: 'email',
            QUESTION: 'EMAIL',
            REQUIRED: 1,
          },
          {
            TYPE: 'input',
            VALIDATION: 'text',
            QUESTION: 'PHONE',
            REQUIRED: 1,
          },
          {
            TYPE: 'input',
            VALIDATION: 'text',
            QUESTION: 'MOBILE',
            REQUIRED: 1,
          },
          {
            TYPE: 'input',
            VALIDATION: 'text',
            QUESTION: 'DEPARTMENT',
            REQUIRED: 1,
          },
          {
            TYPE: 'textarea',
            VALIDATION: 'text',
            QUESTION: 'DETAILS',
            REQUIRED: 1,
          },
        ];

        const newInput2 = newForm.map(x => ({
          KSR_ID: result.id,
          ...x,
        }));

        const searchOpts2 = {
          oracleConnection,
          table: KSRFORM,
          input: newInput2,
          user: NAME,
        };
        const result2 = await addMany(searchOpts2);
      }

      // console.log(result);
      return result;
    },
    /**
     * Update a record based on ID
     * @param {Object} param0 main input object
     * @param {String} param0.id ID
     * @param {String} param0.input Object containing updated data
     */
    updateKSR: async (parent, { id, input }) => {
      const {
        TITLE, TYPE, CONTENT, REGISTER, NAME, LIMIT, START_DATE, END_DATE,
      } = input;
      const newInput = {
        TITLE,
        TYPE,
        CONTENT,
        REGISTER,
        LIMIT,
        START_DATE: new Date(`${START_DATE} 08:00`),
        END_DATE: new Date(`${END_DATE} 08:00`),
      };
      // console.log(START_DATE);
      // console.log(newInput.START_DATE);
      const searchOpts = {
        oracleConnection,
        table: KSR,
        input: newInput,
        user: NAME,
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
    deleteKSR: async (parent, { id }) => {
      // delete Listing
      const where = { ID: id };
      const searchOpts = {
        oracleConnection,
        table: KSR,
        where,
        id,
      };
      const result = await deleteOne(searchOpts);

      // delete form
      const whereForm = { KSR_ID: id };
      const searchOptsForm = {
        oracleConnection,
        table: KSRFORM,
        where: whereForm,
        id,
      };
      await deleteOne(searchOptsForm);

      // delete registration, use same where with form
      const searchOptsRegistration = {
        oracleConnection,
        table: KSRREGISTRATION,
        where: whereForm,
        id,
      };
      await deleteOne(searchOptsRegistration);

      return result;
    },
  },
};
