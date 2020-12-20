
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

module.exports = {
  getFilter,
};
