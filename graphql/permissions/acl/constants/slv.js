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
    user_types: [ADMIN, BC, PUBLIC],
  },
  {
    module: 'company_survey',
    user_types: [ADMIN, BC, PUBLIC],
  },
  {
    module: 'survey_assessment',
    user_types: [ADMIN, BC, PUBLIC],
  },
  {
    module: 'all_SLV',
    user_types: [ADMIN, BC, PUBLIC],
  },
];

module.exports = acl;
