const getWhere = (msic) => {
  const newMSIC = (msic && msic !== 'ALL') ? { MSIC: msic } : null;
  return {
    where: { ...newMSIC },
  };
};

module.exports = {
  Query: {
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.msic msic
         */
    allMSIC: async (
      parent, { msic }, { connectors: { FileSlvMSIC } },
    ) => {
      const where = getWhere(msic);
      const searchOpts = {
        ...where,
        order: [['MSIC']],
      };
      const result = await FileSlvMSIC.findAll(searchOpts);
      return result;
    },
  },
};
