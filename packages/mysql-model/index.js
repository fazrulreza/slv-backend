const Sequelize = require('sequelize');
const moment = require('moment');

class MysqlModel {
  constructor({
    host, username, password, database,
  }, table, attributes) {
    this.sequelize = new Sequelize(database, username, password, {
      host,
      dialect: 'mysql',
      logging: false,
      define: {
        freezeTableName: true,
        timestamps: false,
      },
    });
    this.model = this.sequelize.define(table, attributes);
  }

  count({ where, group, attributes }) {
    return this.model.count({ where, group, attributes });
  }

  findOne({ where }) {
    return this.model.findOne({ where });
  }

  findAll({
    where, limit, offset, order, attributes, group,
  }) {
    return this.model.findAll({
      where, limit, offset, order, attributes, group,
    });
  }

  findById(id) {
    return this.model.findByPk(id);
  }

  create(object) {
    return this.model.create(object);
  }

  delete({ where }) {
    return this.model.destroy({ where });
  }

  max({ field, where }) {
    return this.model.max(field, { where });
  }

  update({ object, where }) {
    return this.model.update(object, { where });
  }

  static generateId() {
    const baseTime = moment().format('YYYYMMDDHHmmss');
    const pad = '000000';
    const n = (Math.random().toFixed(5) * 100000);
    const randomNo = (pad + n).slice(-pad.length);
    return baseTime + randomNo;
  }

  static generateHistory(user, purpose, createdAt) {
    const baseTime = moment().format('YYYY-MM-DD HH:mm:ss');
    const updatePart = {
      UPDATED_AT: baseTime,
      UPDATED_BY: user,
    };
    if (purpose === 'CREATE') {
      return {
        CREATED_AT: baseTime,
        CREATED_BY: user,
        ...updatePart,
      };
    }
    return {
      CREATED_AT: moment(createdAt).format('YYYY-MM-DD HH:mm:ss'),
      ...updatePart,
    };
  }
}

module.exports = MysqlModel;
