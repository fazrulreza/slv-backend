const { oracleConnection, KSRFORM, KSRREGISTRATION } = require('../../../config');
const {
  findAll, deleteMany, addMany, updateMany,
} = require('../../../packages/oracle-model');

module.exports = {
  Query: {
    /**
     * Retrieve all
     * @param {Object} param0 main input object
     * @param {String} param0.size sme size
     */
    ksrFormList: async (parent, {
      where, all = true, offset, limit, order, id,
    }) => {
      const sortOrder = ['NAME', 'EMAIL', 'PHONE', 'MOBILE', 'DEPARTMENT', 'DETAILS'];
      const searchOpts = {
        oracleConnection,
        table: KSRFORM,
        field: '*',
        where,
        offset,
        limit,
        order,
      };
      const result = await findAll(searchOpts);
      let finalResult = result;

      // plugging in value
      if (id) {
        const parsedWhere = JSON.parse(where);
        const regWhere = JSON.stringify({
          ...parsedWhere,
          REGISTRATION_ID: id,
        });
        const searchOptsReg = {
          oracleConnection,
          table: KSRREGISTRATION,
          where: regWhere,
          field: '*',
        };
        const regResult = await findAll(searchOptsReg);
        finalResult = finalResult.map((x) => {
          const valueField = regResult.filter(y => y.FIELD === x.QUESTION);
          return {
            ...x,
            VALUE: valueField.length !== 0 ? valueField[0].VALUE : '',
            FORM_ID: valueField.length !== 0 ? valueField[0].ID : '',
          };
        });
      }
      // sorting
      const part2 = finalResult.sort((a, b) => sortOrder.indexOf(a.QUESTION) - sortOrder.indexOf(b.QUESTION));
      const part1 = part2.splice(part2.length - sortOrder.length, part2.length);
      const sortedResult = part1.concat(part2);

      if (all) return sortedResult;
      return part2;
    },
  },
  Mutation: {
    /**
     * Insert a record
     * @param {Object} param0 main input object
     * @param {String} param0.input Object containing input data
     */
    addKsrForm: async (parent, { input }) => {
      const {
        KSR_ID, NAME, SHIRT, FILE, FORM,
      } = input;

      let addResult = {};
      let deleteResult = {};
      let updateResult = {};

      // prepare data
      const newForm = FORM;
      // add default field for SHIRT
      if (SHIRT === 'Yes') {
        const shirtParam = {
          ID: '0',
          TYPE: 'dropdown',
          VALIDATION: 'shirt',
          QUESTION: 'SHIRT SIZE',
          REQUIRED: 1,
        };
        newForm.push(shirtParam);
      }
      // if (FILE === 'Yes') {
      //   const fileParam = {
      //     ID: '0',
      //     TYPE: 'dropdown',
      //     VALIDATION: 'file',
      //     QUESTION: '',
      //     REQUIRED: 1,
      //   };
      //   FORM.push(fileParam);
      // }
      // ksr id + uppercase question
      const newInput = newForm.map(x => ({
        ...x,
        KSR_ID,
        QUESTION: x.QUESTION.toUpperCase(),
      }));

      // get existing
      const sortOrder = ['NAME', 'EMAIL', 'PHONE', 'MOBILE', 'DEPARTMENT', 'DETAILS'];
      const where = JSON.stringify({
        KSR_ID,
      });
      const searchOptsExist = {
        oracleConnection,
        table: KSRFORM,
        field: 'ID, KSR_ID, QUESTION',
        where,
      };
      const preExist = await findAll(searchOptsExist);
      // filter default fields
      const exist = preExist.filter((x) => {
        const filter = sortOrder.filter(y => y === x.QUESTION);
        return filter.length === 0;
      });

      // check for no change
      if (newInput.length === exist.length && newInput.length === 0) {
        return {
          id: '-1',
          added: 0,
          error: null,
        };
      }
      // newly added
      const newEntry = newInput.filter(x => x.ID === '0');
      if (newEntry.length !== 0) {
        const searchOptsAdd = {
          oracleConnection,
          table: KSRFORM,
          input: newEntry,
          user: NAME,
        };
        addResult = await addMany(searchOptsAdd);
      }
      // console.log('new ', newEntry);

      // deleted
      const deleteEntry = exist.filter((x) => {
        const deletedList = newInput.filter(y => y.ID === x.ID);
        return deletedList.length === 0;
      });
      if (deleteEntry.length !== 0) {
        const whereDelete = deleteEntry.map(x => ({
          ID: x.ID,
        }));
        const searchOptsDelete = {
          oracleConnection,
          table: KSRFORM,
          where: whereDelete,
        };
        deleteResult = await deleteMany(searchOptsDelete);
      }
      // console.log('delete ', deleteEntry);

      // to be updated
      const updateEntry = newInput.filter((x) => {
        const existed = exist.filter(y => y.ID === x.ID);
        return existed.length !== 0;
      });
      if (updateEntry.length !== 0) {
        const updateInput = updateEntry.map((z) => {
          const newObj = Object.assign({}, z);
          const { ID } = z;
          delete newObj.ID;
          return {
            ...newObj,
            ID,
          };
        });
        const searchOptsUpdate = {
          oracleConnection,
          table: KSRFORM,
          input: updateInput,
          user: NAME,
        };
        updateResult = await updateMany(searchOptsUpdate);

        // update KSR Registration field
        const updateKSRReg = updateEntry.map(async (a) => {
          // get current value
          const existed2 = exist.filter(y => y.ID === a.ID);
          const whereListReg = JSON.stringify({
            KSR_ID,
            FIELD: existed2[0].QUESTION,
          });
          const getListReg = {
            oracleConnection,
            table: KSRREGISTRATION,
            field: 'FIELD, ID',
            where: whereListReg,
          };
          const resultGetReg = await findAll(getListReg);

          // update with new value
          if (resultGetReg.length !== 0) {
            const updateRegParam = resultGetReg.map(b => ({
              ...b,
              FIELD: a.QUESTION,
            }));
            const updateListReg = {
              oracleConnection,
              table: KSRREGISTRATION,
              input: updateRegParam,
              user: NAME,
            };
            return updateMany(updateListReg);
          }
        });
      }
      // console.log('update ', updateResult);

      const result = {
        addResult,
        updateResult,
        deleteResult,
        id: KSR_ID,
      };
      return result;
    },
  },
};
