const oracledb = require('oracledb');
const { oracleConnection } = require('./config');

const _options = {
    outFormat: oracledb.OUT_FORMAT_OBJECT,
}

const run = async() => {

  let connection;

  try {
    connection = await oracledb.getConnection(oracleConnection[process.env.NODE_ENV]);

    const result = await connection.execute(
      `SELECT * FROM PROCUREMENT
       WHERE ID = :id`,
      ["2020062409380011"],  // bind value for :id
      {
          ..._options,
          maxRows: 1,
      }
    );
    console.log(result.rows);

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

run();