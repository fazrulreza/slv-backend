const mysqlConnection = {
  host: process.env.MYSQL_HOST,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const COMPANY_PROFILE = 'company_profile';
const SURVEY = 'survey';
const MSIC = 'msic';
const ASSESSMENT = 'assessment';
const USER_ROLE = 'user_role';
const ELSA_SCORECARD = 'elsa_scorecard';

module.exports = {
  mysqlConnection,
  ASSESSMENT,
  COMPANY_PROFILE,
  ELSA_SCORECARD,
  MSIC,
  SURVEY,
  USER_ROLE,
};
