const mysqlConnection = {
  host: process.env.MYSQL_HOST,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const COMPANY_PROFILE = 'company_profile';
const QUESTIONNAIRE = 'questionnaire';
const MSIC = 'msic';

module.exports = {
  mysqlConnection,
  COMPANY_PROFILE,
  QUESTIONNAIRE,
  MSIC,
};
