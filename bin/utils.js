/**
 * @param {string} camelCaseString 
 * @returns {string}
 */
function camelToSnake(camelCaseString) {
  return camelCaseString.replace(/[A-Z]/g, (match, offset) => {
    return (offset > 0 ? '_' : '') + match.toLowerCase();
  });
}

/**
 * @param {string} snakeCaseString 
 * @returns {string}
 */
function snakeToCamel(snakeCaseString) {
  return snakeCaseString.replace(/_([a-z])/g, (match, capture) => {
    return capture.toUpperCase();
  });
}

module.exports = {
  camelToSnake, 
  snakeToCamel
};