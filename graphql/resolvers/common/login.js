const moment = require('moment');
const Login = require('../../../packages/ldap');
const { generateHistory } = require('../../../packages/mysql-model');
const {
  processUserRolesOutput, verifyToken, signToken, comparePasswordAsync,
} = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const {
  SessionExpiredError, JsonWebTokenError, NotFoundError, WrongPasswordError,
} = require('../../permissions/errors');
const logger = require('../../../packages/logger');

module.exports = {
  Mutation: {
    ldapLogin: async (
      parent, { input },
      { connectors: { MysqlSlvUser, MysqlSlvUserRole, MysqlSlvUserPublic } },
    ) => {
      // Retrieve LDAP account

      logger.info(`ldapLogin --> input: ${input}`);
      const userType = 10;
      const userData = verifyToken(input);

      let userRoleList = {};
      let data = {};
      let mini = {};
      let expire = '30m';

      // login process
      switch (true) {
        case userData.name === 'TokenExpiredError': {
          logger.error('ldapLogin --> TokenExpiredError');
          throw new SessionExpiredError();
        }
        case userData.name === 'JsonWebTokenError': {
          logger.error(`ldapLogin --> JsonWebTokenError --> error: ${userData.message}`);
          throw new JsonWebTokenError({ message: userData.message });
        }
        case !userData.public: {
          logger.debug('ldapLogin --> Not Public, checking in AD');
          // find from AD
          const userInfo = await Login(userData);
          logger.debug(`ldapLogin --> User Info from AD: ${JSON.stringify(userInfo)}`);

          const {
            cn, mail, thumbnailPhoto, telephoneNumber, department, mobile,
          } = userInfo;

          const photo = thumbnailPhoto.toString('base64');

          const searchOpts = {
            where: { USER: mail },
          };
          const resUser = await MysqlSlvUser.findOne(searchOpts);
          const uRole = resUser ? resUser.dataValues.ROLE : userType;
          logger.debug(`ldapLogin --> User Role from DB: ${uRole}`);

          // return data structure
          data = {
            username: userData.username,
            cn,
            mail,
            photo,
            telephoneNumber,
            mobile,
            department,
            userType: uRole,
            // membership,
          };

          mini = {
            mail,
            userType: uRole,
          };

          logger.debug(`ldapLogin --> data result: ${JSON.stringify(data)}`);
          logger.debug(`ldapLogin --> mini result: ${JSON.stringify(mini)}`);

          break;
        }
        case (userData.source === 'GOOGLE' || userData.source === 'FACEBOOK'): {
          logger.debug('ldapLogin --> Login from public using GOOGLE / FACEBOOK');
          const searchOpts = {
            where: { EMAIL: userData.email },
          };

          const resUser = await MysqlSlvUserPublic.findOne(searchOpts);
          if (!resUser) {
            logger.debug('ldapLogin --> No data found in DB. Creating...');
            const history = generateHistory(userData.email, 'CREATE');
            const newInput = {
              EMAIL: userData.email,
              NAME: userData.name,
              AVATAR: userData.photo,
              GENDER: userData.gender,
              DOB: userData.dob,
              PHONE: userData.phone,
              ...history,
            };
            await MysqlSlvUserPublic.create(newInput);

            data = {
              mail: userData.email,
              mobile: userData.phone,
              photo: userData.photo,
              userType: 10,
            };
            mini = {
              mail: userData.email,
              userType: 10,
            };

            logger.debug(`ldapLogin --> data result: ${JSON.stringify(data)}`);
            logger.debug(`ldapLogin --> mini result: ${JSON.stringify(mini)}`);
          } else {
            logger.debug('ldapLogin --> User found in DB');
            const resultUser = resUser.dataValues;

            data = {
              mail: resultUser.EMAIL,
              mobile: resultUser.PHONE,
              photo: resultUser.AVATAR,
              userType: 10,
            };
            mini = {
              mail: resultUser.EMAIL,
              userType: 10,
            };

            logger.debug(`ldapLogin --> data result: ${JSON.stringify(data)}`);
            logger.debug(`ldapLogin --> mini result: ${JSON.stringify(mini)}`);
          }
          expire = '1y';
          break;
        }
        case userData.public:
        default: {
          logger.debug('ldapLogin --> Login from Public but not from Google / Facebook');
          const searchOpts = {
            where: { EMAIL: userData.username },
          };

          const resUser = await MysqlSlvUserPublic.findOne(searchOpts);
          if (!resUser) {
            logger.error('ldapLogin --> No user found');
            throw new NotFoundError({ message: 'No user found' });
          }
          const resultUser = resUser.dataValues;
          logger.debug(`ldapLogin --> User data from DB: ${JSON.stringify(resultUser)}`);

          const pass = comparePasswordAsync(userData.password, resultUser.PWD);
          logger.debug(`ldapLogin --> Password match : ${pass}`);

          if (!pass) {
            logger.error(`ldapLogin --> Password match = ${pass}`);
            throw WrongPasswordError();
          }

          data = {
            mail: resultUser.EMAIL,
            mobile: resultUser.PHONE,
            photo: resultUser.AVATAR,
            userType: 10,
          };
          mini = {
            mail: resultUser.EMAIL,
            userType: 10,
          };
          expire = '1y';

          logger.debug(`ldapLogin --> data result: ${JSON.stringify(data)}`);
          logger.debug(`ldapLogin --> mini result: ${JSON.stringify(mini)}`);
          break;
        }
      }

      const resUserRole = await MysqlSlvUserRole.findById(data.userType);
      if (resUserRole) {
        const uRoleList = processUserRolesOutput(resUserRole);
        const {
          ID, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT,
          ...others
        } = uRoleList;

        userRoleList = others;
      }

      data = {
        ...data,
        userRoleList,
      };

      mini = {
        ...mini,
        userRoleList,
      };

      logger.debug(`ldapLogin --> final data result: ${JSON.stringify(data)}`);
      logger.debug(`ldapLogin --> final mini result: ${JSON.stringify(mini)}`);

      const tData = { user: data };

      // Create token from user's info (id, username, user_type)
      const token = signToken(tData, expire);

      // Create mini token
      const minitoken = signToken(mini, expire);

      const finalResult = {
        token,
        minitoken,
      };

      logger.debug(`ldapLogin --> output: ${JSON.stringify(finalResult)}`);
      logger.info('ldapLogin --> completed');

      return finalResult;
    },
    tokenBlacklist: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvTokenBlacklist },
      },
    ) => {
      logger.info(`tokenBlacklist --> input: ${input}`);
      const newInput = {
        TOKEN: input,
        CREATED_AT: moment().format('YYYY-MM-DD HH:mm:ss'),
      };
      const result = await MysqlSlvTokenBlacklist.create(newInput);
      const finalResult = !result ? 'FAIL' : 'SUCCESS';
      logger.debug(`tokenBlacklist --> output: ${finalResult}`);
      logger.info('tokenBlacklist --> completed');

      return finalResult;
    }),
  },
};
