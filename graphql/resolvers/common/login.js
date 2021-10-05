const Login = require('../../../packages/ldap');
const { processUserRolesOutput, verifyToken, signToken } = require('../../helper/common');
const { SessionExpiredError, JsonWebTokenError } = require('../../permissions/errors');

const { NODE_ENV } = process.env;

module.exports = {
  Mutation: {
    ldapLogin: async (
      parent, { input },
      { connectors: { MysqlSlvUser, MysqlSlvUserRole } },
    ) => {
      // Retrieve LDAP account

      const userType = 'PUBLIC';
      const userData = verifyToken(input);

      let userRoleList = {};
      let data = {};
      let mini = {};

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
      const token = signToken(tData, '30m');

      // Create mini token
      const minitoken = signToken(mini, '30m');

      return {
        token,
        minitoken,
      };
    },
  },
};
