const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, ELSA_WEIGHTAGE } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  ID: {
    primaryKey: true,
    type: Sequelize.INTEGER.UNSIGNED,
  },
  SUBFACTOR: Sequelize.STRING,
  SIZE: Sequelize.STRING,
  VALUE: Sequelize.INTEGER.UNSIGNED,
};

const MysqlSlvELSAWeightage = new MysqlModel(connection, ELSA_WEIGHTAGE, attributes);

module.exports = MysqlSlvELSAWeightage;
