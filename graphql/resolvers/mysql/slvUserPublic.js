const { generateHistory } = require('../../../packages/mysql-model');
const {
  checkPermission, hashPasswordAsync, processUserRolesOutput, verifyToken,
} = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const { ForbiddenError, UserExistsError, InvalidDataError } = require('../../permissions/errors');
const logger = require('../../../packages/logger');
const { requiredUserFields } = require('../../helper/parameter');
const {
  allUserPublicRule, oneUserPublicRule, createUserPublicRule,
  updateUserPublicRule, deleteUserPublicRule,
} = require('../../permissions/rule');
// const emailer = require('../../../packages/emailer');

const getRoleWhereUser = (userRoleList, mail) => {
  if (userRoleList.DATA_VIEW === 'ALL') {
    return null;
  }
  return { EMAIL: mail };
};

/**
 * Check if company already exist in DB
 * @param {string} EMAIL company name
 * @param {object} MysqlSlvUserPublic User Public Connector Object
 * @param {string} process processname
 * @param {boolean} [register=false] register?
 * @returns {string} N/A
 */
const checkUserExist = async (EMAIL, MysqlSlvUserPublic, process, register = false) => {
  const searchExistOpts = {
    where: { EMAIL },
  };

  const res = await MysqlSlvUserPublic.findOne(searchExistOpts);
  const result = res ? res.dataValues.EMAIL : 'N/A';

  if (register && result !== 'N/A') {
    logger.error(`${process} --> User already exist`);
    throw new UserExistsError();
  }
  return result;
};

/**
 * Validation for user profile fields
 * @param {Object} input Main input object
 */
const checkUserPublicDetails = (input) => {
  // check not empty
  Object.keys(requiredUserFields).forEach((y) => {
    if (!input[y] && !(input.SOURCE !== 'PORTAL' && y === 'PWD')) {
      logger.error(`checkUserPublicDetails --> Invalid ${requiredUserFields[y]}`);
      throw new InvalidDataError({ message: `Invalid ${requiredUserFields[y]}` });
    }
  });
};

module.exports = {
  Query: {
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    allUserPublic: isAuthenticatedResolver.createResolver(async (parent, param, {
      connectors: { MysqlSlvUserPublic, MysqlSlvUserRole },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`allUserPublic --> by ${mail} called with no input`);
      checkPermission(allUserPublicRule, userRoleList, userType, 'allUserPublic');

      const where = getRoleWhereUser(userRoleList, mail);
      logger.debug(`allUserPublic --> search criteria: ${JSON.stringify(where)}`);

      // user
      const searchOpts = {
        where,
        order: [['EMAIL']],
      };
      const resUser = await MysqlSlvUserPublic.findAll(searchOpts);
      logger.debug(`allUserPublic --> user found: ${JSON.stringify(resUser)}`);

      // roles
      const searchOptsRole = { where: null };
      const resUserRole = await MysqlSlvUserRole.findAll(searchOptsRole);
      const resultUserRole = resUserRole.map((y) => y.dataValues);
      logger.debug(`allUserPublic --> user roles found: ${JSON.stringify(resultUserRole)}`);

      const resultPreUser = resUser
        .map((x) => {
          const resU1 = x.dataValues;
          const resU2 = resultUserRole.filter((z) => z.ID === resU1.ROLE)[0];
          return {
            ...resU1,
            USER_ROLE: resU2.NAME,
            MODULE: resU2.MODULE,
          };
        });
      logger.debug(`allUserPublic --> user with user roles found: ${JSON.stringify(resultPreUser)}`);

      const resultUser = userRoleList.MODULE === 'SME' && userType === 1
        ? resultPreUser
        : resultPreUser.filter((w) => w.MODULE === userRoleList.MODULE);

      logger.debug(`allUserPublic --> filtered users found: ${JSON.stringify(resultUser)}`);
      logger.info(`allUserPublic --> by ${mail} completed`);

      return resultUser;
    }),
    /**
         * Retrieve all
         * @param {Object} param0 main input object
         * @param {String} param0.id id
         */
    oneUserPublic: isAuthenticatedResolver.createResolver(async (parent, { email }, {
      connectors: { MysqlSlvUserPublic, MysqlSlvUserRole },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`oneUserPublic --> by ${mail} input: ${email}`);
      checkPermission(oneUserPublicRule, userRoleList, userType, 'oneUserPublic');

      // user
      const searchOpts = { where: { EMAIL: email } };
      const resUser = await MysqlSlvUserPublic.findOne(searchOpts);
      const resultUser = resUser.dataValues;
      logger.debug(`oneUserPublic --> user found: ${JSON.stringify(resultUser)}`);

      // roles
      const searchOptsRole = { where: null };
      const resUserRole = await MysqlSlvUserRole.findAll(searchOptsRole);
      const resultUserRole = resUserRole.map((x) => processUserRolesOutput(x));
      logger.debug(`oneUserPublic --> user roles found: ${JSON.stringify(resultUserRole)}`);

      const finalResult = {
        userPublicOne: resultUser,
        userRole: resultUserRole,
      };

      logger.debug(`oneUserPublic --> output: ${JSON.stringify(finalResult)}`);
      logger.info(`oneUserPublic --> by ${mail} completed`);

      return finalResult;
    }),
  },
  Mutation: {
    /**
     * Retrieve one by name
     * @param {Object} param0 main input object
     * @param {String} param0.NAME company name
     */
    checkUserPublic: async (parent, { EMAIL }, { connectors: { MysqlSlvUserPublic } }) => {
      logger.info(`checkUserPublic --> by public with input: ${EMAIL}`);

      const result = await checkUserExist(EMAIL, MysqlSlvUserPublic, 'checkUserPublic');

      logger.debug(`checkUserPublic --> input: ${result}`);
      logger.info('checkUserPublic --> for public completed');

      return result;
    },
    /**
     * Create user public
     * @param {Object} param0 main input object
     * @param {String} param0.input input
     */
    createUserPublic: isAuthenticatedResolver.createResolver(async (
      parent,
      { input },
      { connectors: { MysqlSlvUserPublic }, user: { mail, userRoleList, userType } },
    ) => {
      // logger.info(`createUserPublic --> by ${mail} input: ${JSON.stringify(input)}`);
      logger.info(`createUserPublic --> by ${mail}`);
      checkPermission(createUserPublicRule, userRoleList, userType, 'createUserPublic');

      // process input
      const parsedInput = verifyToken(input);
      checkUserPublicDetails(parsedInput);
      await checkUserExist(parsedInput.EMAIL, MysqlSlvUserPublic, 'createUserPublic', true);

      const newPwd = await hashPasswordAsync(parsedInput.PWD);

      const history = generateHistory(mail, 'CREATE');
      const newInput = {
        ...parsedInput,
        AVATAR: parsedInput.AVATAR ? JSON.stringify(parsedInput.AVATAR) : null,
        SOURCE: parsedInput.SOURCE ? parsedInput.SOURCE : 'PORTAL',
        PWD: newPwd,
        ...history,
      };
        // console.log(newInput);
      const result = await MysqlSlvUserPublic.create(newInput);

      logger.debug(`createUserPublic --> output: ${JSON.stringify(newInput)}`);
      logger.info(`createUserPublic --> by ${mail} completed`);

      return result;
    }),
    /**
     * Create user public without login needed
     * @param {Object} param0 main input object
     * @param {String} param0.input input
     */
    registerUserPublic: async (parent, { input }, { connectors: { MysqlSlvUserPublic } }) => {
      logger.info('registerUserPublic --> for public');
      logger.debug(`registerUserPublic --> for public with input: ${input}`);

      // process input
      const parsedInput = verifyToken(input);
      checkUserPublicDetails(parsedInput);
      await checkUserExist(parsedInput.EMAIL, MysqlSlvUserPublic, 'registerUserPublic', true);

      const newPwd = await hashPasswordAsync(parsedInput.PWD);

      const history = generateHistory(parsedInput.EMAIL, 'CREATE');
      const newInput = {
        ...parsedInput,
        SOURCE: parsedInput.SOURCE ? parsedInput.SOURCE : 'PORTAL',
        STATUS: 'ACTIVE',
        ROLE: 10,
        PWD: newPwd,
        ...history,
      };
        // console.log(newInput);
      const result = await MysqlSlvUserPublic.create(newInput);

      // const emailInfo = await emailer.sendMail({
      //   from: '"ELSA" <noreply@smebank.com.my>', // sender address
      //   to: parsedInput.EMAIL, // list of receivers
      //   subject: 'Welcome to ELSA!', // Subject line
      //   text: 'Welcome to ELSA!', // plain text body
      //   html: `
      //   <div>
      //     <h3>Welcome to ELSA!</h3>
      //     <p>Click <a href="https://www.elsa.my/">here</a> to start your ELSA journey</p>
      //     <br />
      //     <address>
      //       <small>
      //         <strong>Centre For Entrepreneur Development And Research (CEDAR) Sdn Bhd
      //       </strong>
      //     </small><br>
      //       <small>Level 6, Menara SME Bank, Jalan Sultan Ismail</small><br>
      //       <small>50250 Kuala Lumpur, Wilayah Persekutuan, Malaysia</small><br>
      //       <small>Email: <a href="mailto:support@cedar.my">support@cedar.my</a></small><br>
      //     </address>
      //   </div>`,
      // });

      // logger.debug(`registeruserPublic --> email sent: ${emailInfo.messageId}`);

      logger.debug(`registerUserPublic --> output: ${JSON.stringify(newInput)}`);
      logger.info(`registerUserPublic --> by ${parsedInput.EMAIL} completed`);

      return result;
    },
    /**
     * Update user public
     * @param {Object} param0 main input object
     * @param {String} param0.email email to be updated
     * @param {String} param0.input input
     */
    updateUserPublic: isAuthenticatedResolver.createResolver(async (parent, { email, input }, {
      connectors: { MysqlSlvUserPublic },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`updateUserPublic --> by ${mail} input for ${email}`);
      checkPermission(updateUserPublicRule, userRoleList, userType, 'updateUserPublic', true);

      if (userType === 10 && email !== mail) {
        logger.error('updateUserPublic --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('updateUserPublic --> Permission check passed');

      const parsedInput = verifyToken(input);
      checkUserPublicDetails(parsedInput);
      await checkUserExist(parsedInput.EMAIL, MysqlSlvUserPublic, 'updateUserPublic');

      let newPwd = parsedInput.PWD;

      if (parsedInput.PWD_CHANGE_FLAG) {
        logger.debug(`updateUserPublic --> change password: ${parsedInput.PWD_CHANGE_FLAG}`);
        newPwd = await hashPasswordAsync(parsedInput.PWD);
      }

      const history = generateHistory(mail, 'UPDATE', parsedInput.CREATED_AT);
      const searchOpts = {
        object: {
          ...parsedInput,
          AVATAR: parsedInput.AVATAR ? JSON.stringify(parsedInput.AVATAR) : null,
          PWD: newPwd,
          ...history,
        },
        where: {
          EMAIL: email,
        },
      };
      const result = await MysqlSlvUserPublic.update(searchOpts);
      const result2 = {
        ID: email,
        updated: result[0],
      };
      logger.debug(`updateUserPublic --> output: ${JSON.stringify(result2)}`);
      logger.info(`updateUserPublic --> by ${mail} completed`);

      return result2;
    }),
    /**
     * Delete user public
     * @param {Object} param0 main input object
     * @param {String} param0.email email to be updated
     */
    deleteUserPublic: isAuthenticatedResolver.createResolver(async (parent, { email }, {
      connectors: { MysqlSlvUserPublic },
      user: { mail, userRoleList, userType },
    }) => {
      logger.info(`deleteUserPublic --> by ${mail} input: ${email}`);
      checkPermission(deleteUserPublicRule, userRoleList, userType, 'deleteUserPublic', true);

      if (userType === 10 && email !== mail) {
        logger.error('deleteUserPublic --> Permission check failed');
        throw new ForbiddenError();
      }
      logger.debug('deleteUserPublic --> Permission check passed');

      // remove user
      const searchOpts = {
        where: { EMAIL: email },
      };
      const result = await MysqlSlvUserPublic.delete(searchOpts);

      const result2 = {
        ID: email,
        deleted: result,
      };
      // console.dir(result2, { depth: null, colorized: true });
      logger.debug(`deleteUserPublic --> output: ${JSON.stringify(result2)}`);
      logger.info(`deleteUserPublic --> by ${mail} completed`);

      return result2;
    }),
  },
};
