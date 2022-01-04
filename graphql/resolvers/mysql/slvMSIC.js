const logger = require('../../../packages/logger');

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
      parent, { msic }, { connectors: { MysqlSlvMSIC }, user: { mail } },
    ) => {
      logger.info(`allMSIC --> by ${mail} input: ${msic}`);
      const where = getWhere(msic);

      const searchOpts = {
        ...where,
        order: [['MSIC']],
      };
      const result = await MysqlSlvMSIC.findAll(searchOpts);
      const result2 = result.map((x) => x.dataValues);

      logger.debug(`allMSIC --> total MSIC found: ${result2.length}`);
      logger.info(`allMSIC --> by ${mail} completed`);

      return result2;
    },
  },
};
