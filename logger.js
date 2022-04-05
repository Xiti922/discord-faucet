const winston = require('winston');

const loggerConfig = (process.env.NODE_ENV === 'production') ? {} : {
  level: 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
};

const logger = winston.createLogger({
  level: 'info',
  levels: winston.config.cli.levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(loggerConfig)
  ]
});

module.exports = logger;
