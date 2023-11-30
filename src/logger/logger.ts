import winston, { format, createLogger } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import { SqsHandler } from '../sqs/sqs-handler';
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import { LoggerUtils } from '../01-presentation/api/utils/loggerUtils';
import { ssmGetParameter } from '../ssm/ssmParams';

const { combine, colorize, printf, timestamp } = format;

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

process.env.REGION = 'us-east-1';
process.env.BASE_CLOUDWATCH_URL = `https://${process.env.REGION}.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group`;

export class Logger {
  private _logger: winston.Logger;
  private _sqs: SqsHandler;
  private readonly _baseUrl = process.env.BASE_CLOUDWATCH_URL;
  private readonly _timestamp = new Date().toISOString();
  private readonly _hash = LoggerUtils.generateHash(this._timestamp);

  constructor(
    private readonly _appName: string,
    private readonly _logGroup: string
  ) {
    this._logger = this._initializeWinston();
    this._sqs = new SqsHandler(`/${process.env.STAGE}/slackbot/QUEUE_URL`);
  }

  public info = (message: string, context?: object) => {
    this._log(message, LogLevel.INFO, context);
  };

  public warn = (message: string, context?: object) => {
    this._log(message, LogLevel.WARN, context);
  };

  public error = async (message: string, context?: object) => {
    const timestamp = LoggerUtils.formatTimestamp(this._timestamp);

    const body = {
      message,
      url: `${this._baseUrl}/${this._logGroup}/log-events/${this._appName}$2520${timestamp}$2520${this._hash}`,
      lambdaName: 'Lambida',
      serviceName: this._appName,
      timestamp,
      context
    };

    console.log(body.url, 'URL');

    const sqsMessage = {
      MessageBody: JSON.stringify(body, null, 2)
    };

    this._log(message, LogLevel.ERROR, context);

    const teste = await ssmGetParameter(
      `/${process.env.STAGE}/slackbot/QUEUE_URL`
    );

    if (!teste) return;

    const teste2 = new SqsHandler(teste);
    teste2.sendMessage(sqsMessage);
  };

  public debug = (message: string, context?: object) => {
    if (process.env.NODE_ENV !== 'prd') {
      this._log(message, LogLevel.DEBUG, context); // Don't log debug in production
    }
  };

  private _log = (message: string, level: LogLevel, context?: object) => {
    this._logger.log(level, message, { context });
  };

  private _initializeWinston = () => {
    const logger = createLogger({
      transports: this._getTransports()
    });

    return logger;
  };

  private _getTransports = () => {
    const transports: Array<winston.transport> = [
      new winston.transports.Console({
        format: this._getFormatForConsole()
      }),
      this._getWinstonCloudWatch()
    ];

    return transports;
  };

  private _getFormatForConsole = () => {
    const formatter = (info: winston.Logform.TransformableInfo): string =>
      `[DATA] ${info.timestamp} [SERVIÇO] ${this._appName} [NÍVEL] ${
        info.level
      } [ROTA] ${info.message} [CONTEXTO] -> ${
        info.context ? '\n' + JSON.stringify(info.context, null, 2) : '{}' // Including the context
      }`;

    return combine(
      timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
      printf(formatter),
      colorize({ all: true })
    );
  };

  private _getWinstonCloudWatch = () => {
    const streamName = LoggerUtils.generateLogStreamName(
      this._appName,
      this._timestamp
    );

    return new WinstonCloudWatch({
      cloudWatchLogs: new CloudWatchLogs(),
      level: 'error',
      logGroupName: this._logGroup,
      logStreamName: streamName,
      awsRegion: process.env.REGION ?? 'us-east-1',
      jsonMessage: true
    });
  };
}
