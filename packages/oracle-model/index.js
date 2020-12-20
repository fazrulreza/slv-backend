const oracledb = require('oracledb');
const moment = require('moment');
const wrapper = require('../../packages/wrapper');
const logger = require('../../packages/logger');

oracledb.fetchAsString = [oracledb.DATE];
const baseOptions = {
  outFormat: oracledb.OUT_FORMAT_OBJECT,
};

/**
 * Generic oracledb executor
 * @param {Object} oracleConnection Oracle Connection object
 * @param {Object} sql SQL to be executed
 * @param {*[]} bind bind value
 * @param {Object} options node-oracledb options
 * @param {Boolean} many flag for execute many or one
 */
const oracleExecutor = async (oracleConnection, sql, bind, options, many = false) => {
  let errMsg = null;
  let output;
  // try to connect
  const connection = await wrapper(oracledb.getConnection(oracleConnection));
  if (connection.error) errMsg = `oracledb connect error -> ${connection.error}`;

  // execute sql query
  if (many) {
    output = await wrapper(connection.data.executeMany(sql, bind, options));
  } else {
    output = await wrapper(connection.data.execute(sql, bind, options));
  }
  if (output.error) errMsg = `oracledb execute error -> ${output.error}`;

  // close connection
  const close = await wrapper(connection.data.close());
  if (close.error) errMsg = `oracledb close error -> ${close.error}`;

  const result = {
    data: output.data,
    error: errMsg,
  };

  return result;
};

/**
 * Generate Unique ID
 */
const generateId = () => {
  const baseTime = moment().format('YYYYMMDDHHmmss');
  const pad = '000';
  const n = (Math.random().toFixed(2) * 100);
  const randomNo = (pad + n).slice(-pad.length);
  return baseTime + randomNo;
};

/**
 * Count rows in table
 * @param {Object} param0
 * @param {Object} param0.oracleConnection oracle Conection object
 * @param {String} param0.table table
 * @param {Object} param0.where where parameter
 * @param {Object} param0.group group by
 */
const count = async ({
  oracleConnection, table, where, group,
}) => {
  // search parameter
  let sql = group
    ? `SELECT ${group}, COUNT(*) AS "COUNT" FROM ${table}`
    : `SELECT COUNT(*) AS "COUNT" FROM ${table}`;
  let bind = [];
  if (where) {
    const newWhere = JSON.parse(where);
    delete newWhere.modifier;
    if (!(Object.keys(newWhere).length === 0 && newWhere.constructor === Object)) {
      const whereStatement = Object.keys(newWhere)
        .map(x => `${x} = :${x}`)
        .join(' AND ');
      sql = `${sql} WHERE ${whereStatement}`;
      bind = newWhere;
    }
  }
  if (group) sql = `${sql} GROUP BY ${group}`;
  // console.log(sql);

  const { data, error } = await oracleExecutor(oracleConnection, sql, bind, baseOptions);
  if (error) logger.error(`count error -> ${error}`);

  return data.rows;
};

/**
 * Find a single row by ID
 * @param {Object} param0
 * @param {Object} param0.oracleConnection oracle Conection object
 * @param {String} param0.table table
 * @param {String} param0.id id
 */
const findById = async ({ oracleConnection, table, id }) => {
  // search parameter
  const sql = `SELECT * FROM ${table} WHERE ID = :id`;
  const bind = { id };
  const options = {
    ...baseOptions,
    maxRows: 1,
  };

  const { data, error } = await oracleExecutor(oracleConnection, sql, bind, options);
  if (error) logger.error(`findById error -> ${error}`);

  return data.rows[0];
};

/**
 * find all rows in table
 * @param {Object} param0
 * @param {Object} param0.oracleConnection oracle Conection object
 * @param {String} param0.table table
 * @param {Object} param0.where where parameter
 * @param {Number} param0.limit limit
 * @param {Number} param0.offset offset
 * @param {String} param0.order order by
 */
const findAll = async ({
  oracleConnection, table, field, where, limit, offset = 0, order = 'ID DESC',
}) => {
  // search parameter
  let sql = `SELECT ${field} FROM ${table}`;
  let bind = [];
  if (where) {
    let modifier1 = '';
    let whereStatement = '';
    const newWhere = JSON.parse(where);

    // get modifier out from where object
    if (newWhere.modifier) {
      modifier1 = newWhere.modifier;
      delete newWhere.modifier;
    }

    // modifier sql
    if (modifier1 === 'before-end') {
      modifier1 = 'END_DATE <= SYSDATE';
    } else if (modifier1 === 'after-end') {
      modifier1 = 'END_DATE > SYSDATE';
    }

    // check for empty where
    if (!(Object.keys(newWhere).length === 0 && newWhere.constructor === Object)) {
      whereStatement = Object.keys(newWhere)
        .map(x => `${x} = :${x}`)
        .join(' AND ');
      whereStatement = modifier1 === '' ? `${whereStatement}` : `${whereStatement} AND ${modifier1}`;
      bind = newWhere;
    } else if (modifier1 !== '') {
      whereStatement = modifier1; // modifier becomes the where instead
    }

    sql = whereStatement !== '' ? `${sql} WHERE ${whereStatement}` : sql;
  }
  if (order) sql = `${sql} ORDER BY ${order}`;
  // if (limit) sql = `${sql} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`; // 12c
  if (limit) sql = `SELECT * FROM ( SELECT * FROM ( ${sql} ) WHERE ROWNUM <= ${offset + limit}) WHERE ROWNUM > ${offset}`; // 11g

  // console.log(sql);
  // console.log(bind);

  const { data, error } = await oracleExecutor(oracleConnection, sql, bind, baseOptions);
  if (error) logger.error(`findAll error -> ${error}`);

  return data.rows;
};

/**
 * add multiple rows into table
 * @param {Object} param0
 * @param {Object} param0.oracleConnection oracle Conection object
 * @param {String} param0.table table
 * @param {Object[]} param0.input input object
 * @param {String} param0.user user
 */
const addMany = async ({
  oracleConnection, table, input, user,
}) => {
  let errMsg = null;
  const baseTime = new Date();

  const newInput = input.map(x => ({
    ...x,
    CREATED_AT: baseTime,
    UPDATED_AT: baseTime,
    CREATED_BY: user,
    UPDATED_BY: user,
    ID: generateId(),
  }));

  const preColumns = Object.keys(newInput[0]);
  const columns = Object.keys(newInput[0]).toString();
  const placeholder = preColumns
    .map(x => `:${x}`)
    .toString();

  // insert parameter
  const sql = `INSERT INTO ${table} (${columns})
  VALUES (${placeholder})`;
  const bind = newInput;
  const options = {
    ...baseOptions,
    autoCommit: true,
  };

  const { data, error } = await oracleExecutor(oracleConnection, sql, bind, options, true);
  if (error) {
    errMsg = `addMany error -> ${error}`;
    logger.error(errMsg);
  }
  const result = {
    id: '0',
    added: data ? data.rowsAffected : null,
    error: errMsg,
  };
  return result;
};

/**
 * add single row into table
 * @param {Object} param0
 * @param {Object} param0.oracleConnection oracle Conection object
 * @param {String} param0.table table
 * @param {Object} param0.input input object
 * @param {String} param0.user user
 */
const addOne = async ({
  oracleConnection, table, input, user,
}) => {
  let errMsg = null;
  const baseTime = new Date();
  const ID = generateId();

  const newInput = {
    ID,
    ...input,
    CREATED_AT: baseTime,
    UPDATED_AT: baseTime,
    CREATED_BY: user,
    UPDATED_BY: user,
  };

  const preColumns = Object.keys(newInput);
  const columns = Object.keys(newInput).toString();
  const placeholder = preColumns
    .map(x => `:${x}`)
    .toString();

  // insert parameter
  const sql = `INSERT INTO ${table} (${columns})
  VALUES (${placeholder})`;
  const bind = newInput;
  const options = {
    ...baseOptions,
    autoCommit: true,
  };
  // console.log(sql);
  // console.log(newInput);

  const { data, error } = await oracleExecutor(oracleConnection, sql, bind, options);
  if (error) {
    errMsg = `addOne error -> ${error}`;
    logger.error(errMsg);
  }

  const result = {
    id: ID,
    added: data ? data.rowsAffected : null,
    error: errMsg,
  };

  return result;
};

/**
 * update single row in table
 * @param {Object} param0
 * @param {Object} param0.oracleConnection oracle Conection object
 * @param {String} param0.table table
 * @param {Object} param0.input input object
 * @param {String} param0.id id to be updated
 * @param {String} param0.user user
 */
const updateOne = async ({
  oracleConnection, table, input, id, user, noDateChange = false,
}) => {
  let errMsg = null;
  const baseTime = new Date();

  const newInput = noDateChange
    ? { ...input }
    : {
      ...input,
      UPDATED_AT: baseTime,
      UPDATED_BY: user,
    };
  const newInput2 = {
    ...newInput,
    id,
  };

  const preColumns = Object.keys(newInput);
  const updateStatement = preColumns
    .map(x => `${x} = :${x}`)
    .toString();

  // update parameter
  const sql = `UPDATE ${table} 
  SET ${updateStatement}
  WHERE ID = :id`;
  const bind = newInput2;
  const options = {
    ...baseOptions,
    autoCommit: true,
  };

  const { data, error } = await oracleExecutor(oracleConnection, sql, bind, options);
  if (error) {
    errMsg = `updateOne error -> ${error}`;
    logger.error(errMsg);
  }
  const result = {
    id,
    updated: data ? data.rowsAffected : null,
    error: errMsg,
  };
  return result;
};


/**
 * update multiple row in table
 * @param {Object} param0
 * @param {Object} param0.oracleConnection oracle Conection object
 * @param {String} param0.table table
 * @param {Object} param0.input input object
 * @param {String} param0.id id to be updated
 * @param {String} param0.user user
 */
const updateMany = async ({
  oracleConnection, table, input, user,
}) => {
  let errMsg = null;
  const baseTime = new Date();

  // put ID as the last element
  const newInput = input.map((x) => {
    const { ID } = x;
    delete x.ID;
    return {
      ...x,
      UPDATED_AT: baseTime,
      UPDATED_BY: user,
      ID,
    };
  });

  const preColumns = Object.keys(newInput[0]);
  preColumns.pop(); // remove ID
  const updateStatement = preColumns
    .map(z => `${z} = :${z}`)
    .toString();

  // update parameter
  const sql = `UPDATE ${table} 
  SET ${updateStatement}
  WHERE ID = :ID`;
  const bind = newInput;
  const options = {
    ...baseOptions,
    autoCommit: true,
  };
  // console.log('sql ', sql);
  // console.log('bind ', bind);

  const { data, error } = await oracleExecutor(oracleConnection, sql, bind, options, true);
  if (error) {
    errMsg = `updateMany error -> ${error}`;
    logger.error(errMsg);
  }
  const result = {
    id: 0,
    updated: data ? data.rowsAffected : null,
    error: errMsg,
  };
  return result;
};

/**
 * delete single row from table based on primary key (id)
 * @param {Object} param0
 * @param {Object} param0.oracleConnection oracle Conection object
 * @param {String} param0.table table
 * @param {String} param0.id id to be deleted
 */
const deleteOne = async ({
  oracleConnection, table, where, id,
}) => {
  let errMsg = null;
  const whereStatement = Object.keys(where)
    .map(x => `${x} = :${x}`)
    .join(' AND ');

  // delete parameter
  const sql = `DELETE FROM ${table} WHERE ${whereStatement}`;
  const bind = where;
  const options = {
    ...baseOptions,
    autoCommit: true,
  };

  const { data, error } = await oracleExecutor(oracleConnection, sql, bind, options);
  if (error) {
    errMsg = `deleteOne error -> ${error}`;
    logger.error(errMsg);
  }

  const result = {
    id,
    deleted: data ? data.rowsAffected : null,
    error: errMsg,
  };

  return result;
};

/**
 * delete multiple row from table based on where parameter
 * @param {Object} param0
 * @param {Object} param0.oracleConnection oracle Conection object
 * @param {String} param0.table table
 * @param {Object} param0.where where parameter
 * @param {String} param0.id id to be deleted
 */
const deleteMany = async ({
  oracleConnection, table, where,
}) => {
  let errMsg = null;
  const whereStatement = Object.keys(where[0])
    .map(x => `${x} = :${x}`)
    .join(' AND ');

  // delete parameter
  const sql = `DELETE FROM ${table} WHERE ${whereStatement}`;
  const bind = where;
  const options = {
    ...baseOptions,
    autoCommit: true,
  };

  const { data, error } = await oracleExecutor(oracleConnection, sql, bind, options, true);
  if (error) {
    errMsg = `deleteMany error -> ${error}`;
    logger.error(errMsg);
  }

  const result = {
    id: '0',
    deleted: data ? data.rowsAffected : null,
    error: errMsg,
  };

  return result;
};

module.exports = {
  count,
  findById,
  findAll,
  addOne,
  addMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
  generateId,
};
