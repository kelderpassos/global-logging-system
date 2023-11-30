import { errorLogger, logger } from 'express-winston';
import { transports, format } from 'winston';

export class LogMaker {
  constructor() {
    this.init();
  }

  private init = () => {};

  public createLog = () =>
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

  public createErrorLog = () =>
    errorLogger({
      transports: [
        new transports.File({
          filename: './src/01-presentation/logs/internal-error.log'
        })
      ],
      format: format.combine(format.json(), this.formatError())
    });

  private formatError = () =>
    format.printf(({ level, meta }) => {
      const info = {
        data: meta.date,
        nivel: level,
        url: meta.req.url,
        metodo: meta.req.method,
        cabecalho: meta.req.headers,
        mensagem: `${meta.message}`
      };
      return JSON.stringify(info, null, 2);
      // return `
      // Dia: ${meta.date},
      // Tipo: ${level},
      // Rota: ${meta.req.method} ${meta.req.url},
      // Cabeçalho: ${meta.req.headers.host},
      // Mensagem: ${meta.message}
      // `;
    });
}
