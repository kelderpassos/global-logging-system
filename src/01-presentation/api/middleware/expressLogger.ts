import { transports, format } from 'winston';
import { errorLogger, logger } from 'express-winston';

export class ExpressLogger {
  public static useMiddleware = () =>
    logger({
      transports: [
        new transports.Console(),
        new transports.File({
          level: 'warn',
          filename: './src/01-presentation/logs/warning.log'
        }),
        new transports.File({
          level: 'error',
          filename: './src/01-presentation/logs/error.log'
        })
      ],
      format: format.combine(
        format.json(),
        format.timestamp(),
        format.metadata(),
        format.prettyPrint()
      ),
      statusLevels: true
    });
}
