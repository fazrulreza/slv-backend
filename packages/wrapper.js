/**
   * @desc wrapper function for Promise
   * @param {Promise} Promise - Promise function
   * @return {Object} data - contain data from Promise
   * @return {Object} error - contain error from Promise
    */
const wrapper = promise => promise
  .then(data => ({ data, error: null }))
  .catch(error => ({ error, data: null }));

module.exports = wrapper;
