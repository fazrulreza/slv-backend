import Sequelize from 'sequelize';
import MysqlModel from '../../../packages/mysql-model';
import { mysqlConnection } from '../../../config';

const connection = mysqlConnection[process.env.NODE_ENV];

const attributes = {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: Sequelize.STRING,
  email: Sequelize.STRING,
  phone_no: Sequelize.STRING,
  skillsets: Sequelize.STRING,
  hobby: Sequelize.STRING,
};

const MysqlCdnMainTable = new MysqlModel(connection, 'main_table', attributes);

export default MysqlCdnMainTable;
