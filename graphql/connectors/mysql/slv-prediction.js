const Sequelize = require('sequelize');
const MysqlModel = require('../../../packages/mysql-model');
const { mysqlConnection, PREDICTION } = require('../../../config');

const connection = mysqlConnection;

const attributes = {
  ID: {
    primaryKey: true,
    type: Sequelize.INTEGER.UNSIGNED,
  },
  FACTOR: Sequelize.STRING,
  KEY: Sequelize.STRING,
  VALUE: Sequelize.INTEGER.UNSIGNED,
};

const MysqlSlvPrediction = new MysqlModel(connection, PREDICTION, attributes);

module.exports = MysqlSlvPrediction;
