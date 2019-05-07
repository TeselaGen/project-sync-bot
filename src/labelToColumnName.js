const { invert } = require("lodash");
const columnNameToLabel = require("./columnNameToLabel");

module.exports = invert(columnNameToLabel);
