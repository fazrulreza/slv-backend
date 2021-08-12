const jwt = require('jsonwebtoken');
const Login = require('../../../packages/ldap');

const { SECRET } = process.env;

module.exports = {
  Mutation: {
    ldapLogin: async (parent, { input }, { connectors: { MysqlSlvUser } }) => {
      // Retrieve LDAP account

      const userType = 'PUBLIC';
      const userData = jwt.verify(input, SECRET);

      let data = {};
      let mini = {};

      // login process
      if (!userData.public) {
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
      } else {
        // find from db
      }

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
