const moment = require('moment');
const Login = require('../../../packages/ldap');
const {
  processUserRolesOutput, verifyToken, signToken, comparePasswordAsync,
} = require('../../helper/common');
const { isAuthenticatedResolver } = require('../../permissions/acl');
const {
  SessionExpiredError, JsonWebTokenError, NotFoundError, WrongPasswordError,
} = require('../../permissions/errors');

const { NODE_ENV } = process.env;

module.exports = {
  Mutation: {
    ldapLogin: async (
      parent, { input },
      { connectors: { MysqlSlvUser, MysqlSlvUserRole, MysqlSlvUserPublic } },
    ) => {
      // Retrieve LDAP account

      const userType = 'PUBLIC';
      const userData = verifyToken(input);

      let userRoleList = {};
      let data = {};
      let mini = {};
      let expire = '30m';

      // login process
      switch (true) {
        case userData.name === 'TokenExpiredError': {
          throw new SessionExpiredError();
        }
        case userData.name === 'JsonWebTokenError': {
          throw new JsonWebTokenError({ message: userData.message });
        }
        case NODE_ENV === 'development': {
          // dev environment
          data = {
            username: userData.userName,
            mail: `${userData.username}@smebank.com.my`,
            userType: 1,
          };
          mini = {
            mail: `${userData.username}@smebank.com.my`,
            userType: 1,
          };
          expire = '1y';
          break;
        }
        case !userData.public: {
          // find from AD
          const userInfo = await Login(userData);
          const {
            cn, mail, thumbnailPhoto, telephoneNumber, department, mobile,
          } = userInfo;

          const photo = thumbnailPhoto.toString('base64');

          const searchOpts = {
            where: { USER: mail },
          };
          const resUser = await MysqlSlvUser.findOne(searchOpts);
          const uRole = resUser ? resUser.dataValues.ROLE : userType;

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
          break;
        }
        case userData.public:
        default: {
          // find from DB

          let pass = false;

          const searchOpts = {
            where: { EMAIL: userData.username },
          };

          const resUser = await MysqlSlvUserPublic.findOne(searchOpts);
          if (!resUser) throw new NotFoundError({ message: 'No user found' });

          const resultUser = resUser.dataValues;

          pass = userData.source === 'GOOGLE' || userData.source === 'FACEBOOK'
            ? true
            : comparePasswordAsync(userData.password, resultUser.PWD);

          if (!pass) throw WrongPasswordError();

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

      const tData = { user: data };

      // Create token from user's info (id, username, user_type)
      const token = signToken(tData, expire);

      // Create mini token
      const minitoken = signToken(mini, expire);

      return {
        token,
        minitoken,
      };
    },
    tokenBlacklist: isAuthenticatedResolver.createResolver(async (
      parent, { input }, {
        connectors: { MysqlSlvTokenBlacklist },
      },
    ) => {
      const newInput = {
        TOKEN: input,
        CREATED_AT: moment().format('YYYY-MM-DD HH:mm:ss'),
      };
      const result = await MysqlSlvTokenBlacklist.create(newInput);
      if (!result) return 'FAIL';
      return 'SUCCESS';
    }),
  },
};
