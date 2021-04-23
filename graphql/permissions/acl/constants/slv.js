const { ADMIN, BC, PUBLIC } = require('../../../../config');

const acl = [
  {
    module: 'company',
    user_types: [ADMIN, BC, PUBLIC],
  },
  {
    module: 'survey',
    user_types: [ADMIN, BC, PUBLIC],
  },
  {
    module: 'assessment',
    user_types: [ADMIN, BC],
  },
  {
    module: 'company_survey',
    user_types: [ADMIN, BC, PUBLIC],
  },
  {
    module: 'survey_assessment',
    user_types: [ADMIN, BC],
  },
  {
    module: 'all_SLV',
    user_types: [ADMIN, BC],
  },
  {
    module: 'all',
    user_types: [ADMIN],
  },
  {
    module: 'elsa',
    user_types: [ADMIN, BC],
  },
];

module.exports = acl;
