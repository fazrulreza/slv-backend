const { generateId, generateHistory } = require('../../../packages/mysql-model');

const getWhere = (msic) => {
  const newMSIC = (msic && msic !== 'ALL') ? { MSIC: msic } : null;
  return {
    where: { ...newMSIC },
  };
};


module.exports = {
  Query: {
    /**
         * Retrieve one by ID
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneCompany: async (parent,
      { ID }, { connectors: { MysqlSlvCompanyProfile, MysqlSlvMSIC } }) => {
      const where = getWhere('ALL');
      const searchOpts = {
        ...where,
        order: [['MSIC']],
      };
      const result = await MysqlSlvMSIC.findAll(searchOpts);
      const result2 = result.map(x => x.dataValues);

      const res = await MysqlSlvCompanyProfile.findById(ID);
      if (!res) {
        throw new Error(`No record found with id ${ID}`);
      }
      const finalResult = {
        allMSIC: result2,
        company: res,
      };
      return finalResult;
    },
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.msic msic
         */
    allCompanies: async (
      parent, { msic }, { connectors: { MysqlSlvCompanyProfile } }) => {
      const where = getWhere(msic);
      const searchOpts = {
        ...where,
        order: [['ENTITY_NAME']],
      };
      const result = await MysqlSlvCompanyProfile.findAll(searchOpts);
      const result2 = result.map(x => x.dataValues);
      // console.dir(result2, { depth: null, colorized: true });
      return result2;
    },
  },
  Mutation: {
    createCompany:
      async (parent, { input }, { connectors: { MysqlSlvCompanyProfile } }) => {
        const parsedInput = JSON.parse(input.data);
        const history = generateHistory(input.name, 'CREATE');
        const newInput = {
          ...parsedInput,
          ID: generateId(),
          ...history,
        };
        //   console.log(newInput);
        return MysqlSlvCompanyProfile.create(newInput);
      },
    deleteCompany:
      async (parent, { ID }, { connectors: { MysqlSlvCompanyProfile } }) => {
        const searchOpts = {
          where: { ID },
        };
        const result = await MysqlSlvCompanyProfile.delete(searchOpts);
        const result2 = {
          ID,
          deleted: result,
        };
          // console.dir(result2, { depth: null, colorized: true });
        return result2;
      },
    updateCompany:
      async (parent, { ID, input }, { connectors: { MysqlSlvCompanyProfile } }) => {
        const parsedInput = JSON.parse(input.data);
        const history = generateHistory(input.name, 'UPDATE', parsedInput.CREATED_AT);
        const searchOpts = {
          object: {
            ...parsedInput,
            ...history,
          },
          where: {
            ID,
          },
        };
        const result = await MysqlSlvCompanyProfile.update(searchOpts);
        const result2 = {
          ID,
          updated: result[0],
        };
          // console.dir(result2, { depth: null, colorized: true });
        return result2;
      },
  },
};
