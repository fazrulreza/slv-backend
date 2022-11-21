const moment = require('moment');
const { OAuth2Client } = require('google-auth-library');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const Login = require('../../../packages/ldap');
const { generateHistory } = require('../../../packages/mysql-model');
const {
  processUserRolesOutput, verifyToken, signToken, comparePasswordAsync,
} = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const {
  SessionExpiredError, JsonWebTokenError, NotFoundError, WrongPasswordError,
  UnknownError, NetworkError,
} = require('../../permissions/errors');
const logger = require('../../../packages/logger');
const wrapper = require('../../../packages/wrapper');
const { firebaseConfig } = require('../../../config');

const client = new OAuth2Client(process.env.CLIENT_ID);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

module.exports = {
  Mutation: {
    ldapLogin: async (
      parent,
      { input },
      {
        connectors: {
          MysqlSlvUser, MysqlSlvUserRole, MysqlSlvUserPublic,
          MysqlSlvCompanyProfile, MysqlSlvSurvey,
        },
      },
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
        case userData.username === 'TokenExpiredError': {
          logger.error('ldapLogin --> TokenExpiredError');
          throw new SessionExpiredError();
        }
        case userData.username === 'JsonWebTokenError': {
          logger.error(`ldapLogin --> JsonWebTokenError --> error: ${userData.message}`);
          throw new JsonWebTokenError({ message: userData.message });
        }
        case !userData.public: {
          logger.debug('ldapLogin --> Not Public, checking in AD');
          // find from AD
          const { data: userInfo, error: ldapError } = await wrapper(Login(userData));
          if (ldapError) {
            logger.error(`ldapLogin --> ldapError --> error: ${ldapError}`);
            throw new NetworkError({ message: ldapError });
          }
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

          if (uRole === 1) expire = '12h';

          logger.debug(`ldapLogin --> data result: ${JSON.stringify(data)}`);
          logger.debug(`ldapLogin --> mini result: ${JSON.stringify(mini)}`);

          break;
        }
        case (userData.source === 'GOOGLE' || userData.source === 'FACEBOOK' || userData.source === 'FIREBASE'): {
          logger.debug('ldapLogin --> Login from public using GOOGLE / FACEBOOK / FIREBASE');

          let EMAIL = userData.email ? userData.email : userData.username;
          let NAME = userData.username;
          let AVATAR = userData.photo;

          if (userData.source === 'GOOGLE') {
            const ticket = await client.verifyIdToken({
              idToken: userData.username,
              audience: process.env.CLIENT_ID,
            });
            const { name, email, picture } = ticket.getPayload();
            EMAIL = email;
            NAME = name;
            AVATAR = picture;
          }

          const searchOpts = {
            where: { EMAIL },
          };

          const resUser = await MysqlSlvUserPublic.findOne(searchOpts);
          if (!resUser) {
            logger.debug('ldapLogin --> No data found in DB. Creating...');
            const history = generateHistory(EMAIL, 'CREATE');
            const newInput = {
              SOURCE: 'APP',
              EMAIL,
              NAME,
              AVATAR,
              GENDER: userData.gender,
              DOB: userData.dob,
              PHONE: userData.phone,
              ROLE: 10,
              STATUS: 'ACTIVE',
              ...history,
            };
            await MysqlSlvUserPublic.create(newInput);

            data = {
              mail: EMAIL,
              mobile: userData.phone,
              photo: AVATAR,
              userType: 10,
            };
            mini = {
              mail: EMAIL,
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

          // check in firebase if exist or not
          logger.debug('ldapLogin --> Get data from firebase');
          const { data: fireData, error } = await wrapper(
            signInWithEmailAndPassword(auth, userData.username, userData.password),
          );

          if (error && error.code === 'auth/wrong-password') {
            logger.error('ldapLogin --> Firebase Password match = false');
            throw new WrongPasswordError(error.code);
          }

          // check in DB
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

          // if not exist in firebase, check password
          if (!fireData || error) {
            logger.error(`ldapLogin --> firebase error: ${error.code}`);
            switch (true) {
              case resultUser.SOURCE === 'PORTAL':
              case error.code === 'auth/user-not-found': {
                const pass = await comparePasswordAsync(userData.password, resultUser.PWD);
                logger.debug(`ldapLogin --> Password match : ${pass}`);

                if (!pass) {
                  logger.error(`ldapLogin --> Password match = ${pass}`);
                  throw new WrongPasswordError();
                }
                break;
              }
              case error.code === 'auth/network-request-failed': {
                throw new NetworkError();
              }
              default: {
                throw new UnknownError({ message: error.code });
              }
            }
          }

          data = {
            mail: resultUser.EMAIL,
            mobile: resultUser.PHONE,
            photo: resultUser.AVATAR,
            userType: resultUser.ROLE || 10,
          };
          mini = {
            mail: resultUser.EMAIL,
            userType: resultUser.ROLE || 10,
          };
          expire = '1y';

          logger.debug(`ldapLogin --> data result: ${JSON.stringify(data)}`);
          logger.debug(`ldapLogin --> mini result: ${JSON.stringify(mini)}`);
          break;
        }
      }

      // user roles
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

      // company
      const searchOptsCompany = { where: { CREATED_BY: data.mail } };
      const resCompany = await MysqlSlvCompanyProfile.findOne(searchOptsCompany);
      const COMPANY_ID = resCompany ? resCompany.dataValues.ID : null;

      // survey
      let SURVEY_ID = null;

      if (COMPANY_ID) {
        const searchOptsSurvey = { where: { COMPANY_ID } };
        const resSurvey = await MysqlSlvSurvey.findOne(searchOptsSurvey);
        SURVEY_ID = resSurvey ? resSurvey.dataValues.ID : null;
      }

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
        COMPANY_ID,
        SURVEY_ID,
      };

      logger.debug(`ldapLogin --> output: ${JSON.stringify(finalResult)}`);
      logger.info('ldapLogin --> completed');

      return finalResult;
    },
    tokenBlacklist: isAuthenticatedResolver.createResolver(async (parent, { input }, {
      connectors: { MysqlSlvTokenBlacklist },
    }) => {
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
