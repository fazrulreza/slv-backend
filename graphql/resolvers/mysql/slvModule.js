const { Op } = require('sequelize');
const { generateHistory } = require('../../../packages/mysql-model');
const { checkPermission } = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const logger = require('../../../packages/logger');
const {
  allModulsRule, createModulRule, updateModulRule, deleteModulRule,
} = require('../../permissions/rule');

module.exports = {
  Query: {
    /**
     * Retrieve modules with msic
     * @param {Object} param0 main input object
     */
    modulesAndMSIC: async (parent, param, {
      connectors: { MysqlSlvModule, MysqlSlvMSIC },
      user: { mail },
    }) => {
      logger.info(`modulesAndMSIC --> by ${mail}`);

      // get MSIC list
      const searchOptsMsic = {
        where: null,
        order: [['MSIC']],
      };
      const resMSIC = await MysqlSlvMSIC.findAll(searchOptsMsic);
      const resultMSIC = resMSIC.map((x) => x.dataValues);
      logger.debug('modulesAndMSIC --> MSIC data found');

      // get Modules list
      const searchOptsModules = { where: null };
      const resModules = await MysqlSlvModule.findAll(searchOptsModules);
      const resultModules = resModules.map((x) => x.dataValues);
      logger.debug('modulesAndMSIC --> Module data found');

      const finalResult = {
        allMSIC: resultMSIC,
        allModuls: resultModules,
      };

      logger.debug(`modulesAndMSIC --> output: ${JSON.stringify(finalResult)}`);
      logger.info(`modulesAndMSIC --> by ${mail} completed`);
      return finalResult;
    },
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allModuls: isAuthenticatedResolver.createResolver(async (parent, param, {
      connectors: { MysqlSlvModule },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`allModuls --> by ${mail} called with no input`);
      checkPermission(allModulsRule, userRoleList, userType, 'allModuls');

      // default to module view
      let where = { MODULE: { [Op.substring]: userRoleList.MODULE } };

      // check admin
      if (userRoleList.MODULE === 'SME' && userType === 1) {
        where = null;
      }

      const searchOpts = {
        where,
        order: [['NAME']],
      };
      const result = await MysqlSlvModule.findAll(searchOpts);

      logger.debug(`allModuls --> output: ${JSON.stringify(result)}`);
      logger.info(`allModuls --> by ${mail} completed`);

      return result;
    }),
  },
  Mutation: {
    createModul: isAuthenticatedResolver.createResolver(async (parent, { input }, {
      connectors: { MysqlSlvModule },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`createModul --> by ${mail} input: ${JSON.stringify(input)}`);
      checkPermission(createModulRule, userRoleList, userType, 'createModul');

      // process input
      const processedInput = JSON.parse(input.data);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...processedInput,
        ...history,
      };
        // console.log(newInput);
      const result = await MysqlSlvModule.create(newInput);

      logger.debug(`createModul --> output: ${JSON.stringify(result)}`);
      logger.info(`createModul --> by ${mail} completed`);

      return result;
    }),
    updateModul: isAuthenticatedResolver.createResolver(async (parent, { NAME, input }, {
      connectors: { MysqlSlvModule },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`updateModul --> by ${mail} input for ${NAME}: ${JSON.stringify(input)}`);
      checkPermission(updateModulRule, userRoleList, userType, 'updateModul');

      const processedInput = JSON.parse(input.data);

      const history = generateHistory(mail, 'UPDATE', processedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...processedInput,
          ...history,
        },
        where: {
          NAME,
        },
      };
      const result = await MysqlSlvModule.update(searchOpts);
      const result2 = {
        NAME,
        updated: result[0],
      };

      logger.debug(`updateModul --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateModul --> by ${mail} completed`);

      return result2;
    }),
    deleteModul: isAuthenticatedResolver.createResolver(async (parent, { NAME }, {
      connectors: { MysqlSlvModule },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`deleteModul --> by ${mail} input: ${NAME}`);
      checkPermission(deleteModulRule, userRoleList, userType, 'deleteModul');

      // remove user
      const searchOpts = {
        where: { NAME },
      };
      const result = await MysqlSlvModule.delete(searchOpts);

      const result2 = {
        NAME,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      logger.debug(`deleteModul --> output: ${JSON.stringify(result2)}`);
      logger.info(`deleteModul --> by ${mail} completed`);

      return result2;
    }),
  },
};
