"use strict";

var chalk = require('chalk');

var DEBUG_LEVEL = process.env.DEBUG_LEVEL || 0;
var DEBUG_MAP = ['INFO', 'WARN', 'DEBUG'];

var debug = function debug(msg) {
  var level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;

  if (level <= DEBUG_LEVEL) {
    console.debug(chalk.yellow(`${DEBUG_MAP[level]}:: `), msg);
  }
};

module.exports = debug;