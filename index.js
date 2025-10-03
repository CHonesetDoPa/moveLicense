// index.js - Main entry file for the npm package
const mv = require('./mv.js');

module.exports = mv;

// If running this file directly, execute installation logic
if (require.main === module) {
  require('./install.js');
}