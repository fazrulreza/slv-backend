const mysqlConnection = {
  host: process.env.MYSQL_HOST,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const COMPANY_PROFILE = 'company_profile';
const SURVEY = 'survey';
const SURVEY_HISTORY = 'survey_history';
const MSIC = 'msic';
const ASSESSMENT = 'assessment';
const ASSESSMENT_HISTORY = 'assessment_history';
const USER_ROLE = 'user_role';

module.exports = {
  mysqlConnection,
  COMPANY_PROFILE,
  SURVEY,
  SURVEY_HISTORY,
  MSIC,
  ASSESSMENT,
  ASSESSMENT_HISTORY,
  USER_ROLE,
};
