const oracleConnection = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  connectString: process.env.DB_CONNECT_STRING,
};

const KSRREGISTRATION = 'KSR_REGISTRATION';
const KSR = 'KSR';
const KSRFORM = 'KSR_FORM';
const KSRUSER = 'KSR_USER';
const KSRMEMBERSHIP = 'KSR_MEMBERSHIP';
const PROCUREMENT = 'PROCUREMENT';

// const ssl = {
//   development: {
//     key: './certificates/localhost.key',
//     crt: './certificates/localhost.crt',
//   },
//   production: {
//     key: '../certificates/smebank.com.my2019.key',
//     crt: '../certificates/smebank.com.my2019.crt',
//   },
// };


module.exports = {
  oracleConnection,
  KSRREGISTRATION,
  KSR,
  KSRMEMBERSHIP,
  KSRFORM,
  KSRUSER,
  PROCUREMENT,
  // sso,
  // ssl,
};
