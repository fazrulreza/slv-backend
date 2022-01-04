/**
 * Main logger component
 * Configurable to output either to a file or console.
 */

/** Import method from he module */
const { createLogger, transports, format } = require('winston');
/** destructure timestamp, combine and simple method from format */
const {
  timestamp, combine, printf, prettyPrint, colorize,
} = format;

/** define custom format */
const myFormat = printf((info) => {
  let { message } = info;
  if (info.message.constructor === Object) {
    message = JSON.stringify(info.message, null, 4);
  }
  return `[${info.timestamp}] ${info.level}: ${message}`;
});

/** Create winston logger */
const logger = createLogger({
  format: combine(
    timestamp(),
    prettyPrint(),
    colorize(),
    myFormat,
  ),
  transports: [
    new transports.Console(),
    // , new transports.File({ filename: 'log/result.log' })
  ],
});

logger.level = process.env.LOG_LEVEL;

module.exports = logger;
