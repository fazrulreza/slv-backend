const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, ELSA_SCORECARD } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  ID: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  FACTOR: Sequelize.STRING,
  FINAL_SCORE: Sequelize.STRING,
  FINAL_SCORE_ROUNDDOWN: Sequelize.STRING,
  NEXT_DESIRED_SCORE: Sequelize.STRING,
  NEXT_DESIRED_PROFILE: Sequelize.STRING,
  PRIORITY_ACTION_TAKEN: Sequelize.STRING,
  RECOMMENDED_TIERED_INTERVENTION: Sequelize.STRING,
  COMPANY_ID: Sequelize.STRING,
  MODULE: Sequelize.STRING,
  ASSESSMENT_YEAR: Sequelize.INTEGER.UNSIGNED,
  CREATED_AT: Sequelize.STRING,
  CREATED_BY: Sequelize.STRING,
  UPDATED_AT: Sequelize.STRING,
  UPDATED_BY: Sequelize.STRING,
};

const MysqlSlvELSAScorecard = new MysqlModel(connection, ELSA_SCORECARD, attributes);

module.exports = MysqlSlvELSAScorecard;
