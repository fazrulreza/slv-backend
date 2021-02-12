
const jwt = require('jsonwebtoken');
const Login = require('../../../packages/ldap');

const { SECRET } = process.env;

module.exports = {
  Mutation: {
    ldapLogin: async (parent, { input }, { connectors: { MysqlSlvUserRole } }) => {
      // Retrieve LDAP account

      const userType = 'NON-MEMBER';
      const x = jwt.verify(input, SECRET);

      // login process
      const userInfo = await Login(x);
      const {
        cn, mail, thumbnailPhoto, telephoneNumber, department, mobile,
      } = userInfo;

      const photo = thumbnailPhoto.toString('base64');

      const searchOpts = {
        where: { USER: mail },
      };
      const resUser = await MysqlSlvUserRole.findOne(searchOpts);
      const uRole = resUser ? resUser.dataValues.ROLE : userType;

      // return data structure
      const data = {
        username: x.username,
        cn,
        mail,
        photo,
        telephoneNumber,
        mobile,
        department,
        userType: uRole,
        // membership,
      };

      // Create token from user's info (id, username, user_type)
      const token = jwt.sign(
        { user: data },
        SECRET,
        { expiresIn: '1y' },
      );

      return {
        token,
      };
    },
  },
};
