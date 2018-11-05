import winston from 'winston';
import { environment } from './environment';

const level =
  process.env.LOG_LEVEL || (environment.production ? 'info' : 'debug');

// logger configuration taken from Winston pkg recommended settings
export const logger = winston.createLogger({
  level,
  format: winston.format.combine(winston.format.json(), winston.format.splat()),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (!environment.production) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.simple(),
        winston.format.splat(),
      ),
    }),
  );
}
