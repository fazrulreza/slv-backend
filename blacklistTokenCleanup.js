const { Op } = require('sequelize');
const moment = require('moment');
const MysqlSlvTokenBlacklist = require('./graphql/connectors/mysql/slv-token_blacklist');

const blacklistTokenCleanup = async () => {
  const sevenDaysAgo = moment().subtract(7, 'days').toDate();
  const searchOpts = {
    where: {
      CREATED_AT: {
        [Op.lt]: sevenDaysAgo,
      },
    },
  };

  const result = await MysqlSlvTokenBlacklist.delete(searchOpts);
  console.log(`Successfully removed ${result.length} records with date less than ${sevenDaysAgo} `);
  return 'OK';
};

blacklistTokenCleanup();
