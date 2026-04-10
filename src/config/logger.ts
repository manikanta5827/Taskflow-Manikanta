import winston from 'winston';
import { env } from './env';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: env.LOG_FILE }),
  ],
});

if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
  logger.add(
    new winston.transports.Console({
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
