const jwt = require('jsonwebtoken');
const Login = require('../../../packages/ldap');
const { processUserRolesOutput } = require('../../helper/common');

const { SECRET, NODE_ENV } = process.env;

module.exports = {
  Mutation: {
    ldapLogin: async (parent, { input }, { connectors: { MysqlSlvUser, MysqlSlvUserRole } }) => {
      // Retrieve LDAP account

      const userType = 'PUBLIC';
      const userData = jwt.verify(input, SECRET);

      let userRoleList = {};
      let data = {};
      let mini = {};

      // login process
      switch (true) {
        case NODE_ENV === 'development': {
          // dev environment
          data = {
            username: userData.userName,
            mail: `${userData.username}@smebank.com.my`,
            userType: 'ADMIN',
          };
          mini = {
            mail: `${userData.username}@smebank.com.my`,
            userType: 'ADMIN',
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

      const searchOptsRole = {
        where: { NAME: data.userType },
      };

      const resUserRole = await MysqlSlvUserRole.findOne(searchOptsRole);
      if (resUserRole) {
        const uRoleList = processUserRolesOutput(resUserRole);
        const {
          ID, NAME, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT,
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

      // Create token from user's info (id, username, user_type)
      const token = jwt.sign(
        { user: data },
        SECRET,
        { expiresIn: '1y' },
      );

      // Create mini token
      const minitoken = jwt.sign(
        mini,
        SECRET,
        { expiresIn: '1y' },
      );

      return {
        token,
        minitoken,
      };
    },
  },
};
