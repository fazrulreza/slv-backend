const slvAcl = require('./constants/slv');
const userAcl = require('./constants/user');
const getXAcl = require('./constants/getx');

const acl = [
  ...slvAcl,
  ...userAcl,
  ...getXAcl,
];

const canAccess = (module, userType) => {
  const filteredUsers = acl.filter((x) => x.module === module);
  if (filteredUsers.length === 0) return false;

  const allowedUserTypes = filteredUsers[0].user_types;
  const hasPriviledge = allowedUserTypes.indexOf(userType) >= 0;
  return hasPriviledge;
};

const hasCredit = (credit) => credit > 0;
const deductCredit = (credit) => credit - 1;

module.exports = {
  canAccess,
  hasCredit,
  deductCredit,
};
