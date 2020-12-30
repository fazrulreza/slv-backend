
const getFilter = (size, state, sector, revenue, year, division, msic) => {
  let filter = '';
  if (size && !filter.includes('sme_size.keyword') && size !== 'ALL') {
    filter += ` sme_size.keyword: "${getSize(size)}" `;
  }
  if (state && !filter.includes('state_a.keyword') && state !== 'ALL') {
    filter += ` state_a.keyword: "${state}" `;
  }
  if (sector && !filter.includes('msic_sector.keyword') && sector !== 'ALL') {
    filter += ` msic_sector.keyword: "${sector}" `;
  }
  if (year && !filter.includes('year.keyword')) {
    filter += ` year.keyword: "${year}" `;
  }
  if (revenue && !filter.includes('yr_revenue_amt')) {
    filter += ` yr_revenue_amt: [${revenue}] `;
  }
  if (division && !filter.includes('msic_division')) {
    filter += ` msic_division.keyword: "${division}" `;
  }
  if (msic && !filter.includes('msic_item')) {
    filter += ` msic_item.keyword: "${msic}" `;
  }

  //   _.forOwn(rest, (value, key) => {
  //     const field = key.replace('.keyword', '');
  //     filter += ` ${field}: "${value}" `;
  //   });

  return filter;
};


const processQuestionnaireResult = result => ({
  AVAILABLE_SYSTEM: JSON.parse(result.AVAILABLE_SYSTEM),
  MARKETING_TYPE: JSON.parse(result.MARKETING_TYPE),
  ONLINE_MARKETING_TYPE: result.ONLINE_MARKETING_TYPE
    ? JSON.parse(result.ONLINE_MARKETING_TYPE)
    : [],
  BUSINESS_FUTURE_PLAN: JSON.parse(result.BUSINESS_FUTURE_PLAN),
  SEEK_FINANCING_METHOD: result.SEEK_FINANCING_METHOD
    ? JSON.parse(result.SEEK_FINANCING_METHOD)
    : [],
  CUSTOMER_PAYMENT_METHODS: JSON.parse(result.CUSTOMER_PAYMENT_METHODS),
  EMPLOYEE_COUNT_DETAIL: {
    FULLTIME: result.FULLTIME_EMPLOYEE_COUNT,
    PARTTIME: result.PARTTIME_EMPLOYEE_COUNT,
  },
  EMPLOYEE_DETAILS: {
    FULLTIME: result.FULLTIME_EMPLOYEE_COUNT,
    OWNER_MANAGED_100: result.OWNER_MANAGED_100,
  },
});

module.exports = {
  getFilter,
  processQuestionnaireResult,
};
