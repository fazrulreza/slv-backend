const mysqlConnection = {
  host: process.env.MYSQL_HOST,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  STORAGE_BUCKET: process.env.MYSQL_HOST,
  MESSAGING_SENDER_ID: process.env.MYSQL_HOST,
  APP_ID: process.env.MYSQL_HOST,
  MEASUREMENT_ID: process.env.MYSQL_HOST,
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
const TOKEN_BLACKLIST = 'token_blacklist';
const MODULE = 'module';

const GETX_KPI = 'getx_kpi';
const GETX_ACHIEVEMENT = 'getx_achievement';
const GETX_SIGN = 'getx_sign';
const GETX_ATTACHMENT = 'getx_attachment';

const ADMIN = 'ADMIN';
const BC = 'BC';
const PUBLIC = 'PUBLIC';

const whiteListOperation = [
  'registerUserPublic',
  'login',
  'checkUserPublic',
];

module.exports = {
  mysqlConnection,
  firebaseConfig,
  ASSESSMENT,
  COMPANY_PROFILE,
  ELSA_SCORECARD,
  ELSA_WEIGHTAGE,
  MODULE,
  MSIC,
  PREDICTION,
  SURVEY,
  USER,
  USER_PUBLIC,
  USER_ROLE,
  TOKEN_BLACKLIST,
  GETX_KPI,
  GETX_ACHIEVEMENT,
  GETX_SIGN,
  GETX_ATTACHMENT,
  ADMIN,
  BC,
  PUBLIC,
  whiteListOperation,
};
