const { ADMIN } = require('../../../../config');

const acl = [
  {
    module: 'user',
    user_types: [ADMIN],
  },
];

module.exports = acl;
