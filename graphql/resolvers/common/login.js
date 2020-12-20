
const jwt = require('jsonwebtoken');
const Login = require('../../../packages/ldap');
const {
  oracleConnection, KSR, KSRREGISTRATION, KSRUSER, KSRMEMBERSHIP,
} = require('../../../config');
const { findAll } = require('../../../packages/oracle-model');

const { SECRET } = process.env;

module.exports = {
  Query: {
    userData: async (parent, { id }) => {
      // get List
      const searchOpts = {
        oracleConnection,
        table: KSR,
        field: '*',
      };
      const listing = await findAll(searchOpts);

      // get List enrolled
      const whereReg = JSON.stringify({
        FIELD: 'EMAIL',
        VALUE: id,
      });
      const searchOptsReg = {
        oracleConnection,
        table: KSRREGISTRATION,
        field: '*',
        where: whereReg,
      };

      const registered = await findAll(searchOptsReg);
      const finalRegistered = registered.map((a) => {
        const { KSR_ID, REGISTRATION_ID } = a;
        const match = listing.find(b => b.ID === KSR_ID);
        return {
          REGISTRATION_ID,
          KSR_ID,
          KSR_NAME: match.TITLE,
        };
      });

      // get membership list
      const whereMember = JSON.stringify({
        MAIL: id,
      });
      const searchOptsMember = {
        oracleConnection,
        table: KSRMEMBERSHIP,
        field: '*',
        where: whereMember,
      };
      const membershipList = await findAll(searchOptsMember);
      const membership = membershipList.map((y) => {
        const { TYPE, VALUE, EXPIRY_DATE } = y;
        return {
          TYPE,
          VALUE,
          EXPIRY_DATE,
        };
      });

      const finalResult = {
        registration: finalRegistered,
        membership,
      };

      return finalResult;
    },
  },
  Mutation: {
    ldapLogin: async (parent, { input }) => {
      // Retrieve LDAP account

      let userType = 'NON-MEMBER';
      const x = jwt.verify(input, SECRET);

      // login process
      const userInfo = await Login(x);
      const {
        cn, mail, thumbnailPhoto, telephoneNumber, department, mobile,
      } = userInfo;

      const photo = thumbnailPhoto.toString('base64');

      // get user type
      const where = JSON.stringify({
        MAIL: mail,
      });
      const searchOpts = {
        oracleConnection,
        table: KSRUSER,
        field: '*',
        where,
      };
      const userList = await findAll(searchOpts);
      if (userList.length !== 0) userType = userList[0].USER_TYPE;

      // return data structure
      const data = {
        username: x.username,
        cn,
        mail,
        photo,
        telephoneNumber,
        mobile,
        department,
        userType,
        membership,
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
