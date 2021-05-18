const { ADMIN, BC } = require('../../../../config');

const acl = [
  {
    module: 'kpi',
    user_types: [ADMIN, BC],
  },
  {
    module: 'kpi_company',
    user_types: [ADMIN, BC],
  },
  {
    module: 'kpi_elsa',
    user_types: [ADMIN, BC],
  },
];

module.exports = acl;
