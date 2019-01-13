const chalk = require('chalk')

const DEBUG_LEVEL = process.env.DEBUG_LEVEL || 0

const DEBUG_MAP = [
  'INFO',
  'WARN',
  'DEBUG'
]

const debug = (msg, level = 2) => {
  if (level <= DEBUG_LEVEL) {
    console.debug(chalk.yellow(`${DEBUG_MAP[level]}:: `), msg)
  }
}

module.exports = debug
