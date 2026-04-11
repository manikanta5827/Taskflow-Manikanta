import { createLogger, format, transports } from 'winston';
import { env } from './env';

const { combine, timestamp, json, colorize, printf, errors } = format;

export const logger = createLogger({
  level: env.LOG_LEVEL,
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports:
    env.NODE_ENV === 'test'
      ? [new transports.Console({ silent: true })]
      : [
          new transports.File({ filename: 'logs/error.log', level: 'error' }),
          new transports.File({ filename: env.LOG_FILE }),
        ],
});

if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
  logger.add(
    new transports.Console({
      format: combine(
        colorize(),
        printf((info) => {
          const { level, message, timestamp, stack } = info;
          return `${timestamp} ${level}: ${stack || message}`;
        })
      ),
    })
  );
}
