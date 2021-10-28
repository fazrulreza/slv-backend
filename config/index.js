const mysqlConnection = {
  host: process.env.MYSQL_HOST,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const COMPANY_PROFILE = 'company_profile';
const SURVEY = 'survey';
const MSIC = 'msic';
const PREDICTION = 'prediction';
const ASSESSMENT = 'assessment';
const USER = 'user';
const USER_PUBLIC = 'user_public';
const USER_ROLE = 'user_role';
const ELSA_SCORECARD = 'elsa_scorecard';
const ELSA_WEIGHTAGE = 'elsa_weightage';

const GETX_KPI = 'getx_kpi';
const GETX_SIGN = 'getx_sign';
const GETX_ATTACHMENT = 'getx_attachment';

const ADMIN = 'ADMIN';
const BC = 'BC';
const PUBLIC = 'PUBLIC';

module.exports = {
  mysqlConnection,
  ASSESSMENT,
  COMPANY_PROFILE,
  ELSA_SCORECARD,
  ELSA_WEIGHTAGE,
  MSIC,
  PREDICTION,
  SURVEY,
  USER,
  USER_PUBLIC,
  USER_ROLE,
  GETX_KPI,
  GETX_SIGN,
  GETX_ATTACHMENT,
  ADMIN,
  BC,
  PUBLIC,
};
