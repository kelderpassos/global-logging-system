import winston, { format, createLogger } from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import { SqsHandler } from '../sqs/sqs-handler';
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import { LoggerUtils } from '../01-presentation/api/utils/loggerUtils';
import { ssmGetParameter } from '../ssm/ssmFunctions';
import { LogLevel } from '../03-model/logLevel.enum';

const { combine, colorize, printf, timestamp } = format;

export type Log = {
  message: string;
  url: string;
  lambdaName: string;
  serviceName: string;
  timestamp: string;
  context: object | undefined;
};

process.env.REGION = 'us-east-1';
process.env.BASE_CLOUDWATCH_URL = `https://${process.env.REGION}.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group`;

export abstract class Logger {
  private _logger: winston.Logger;
  private readonly _baseUrl = process.env.BASE_CLOUDWATCH_URL;
  private readonly _timestamp = new Date().toISOString();
  private readonly _hash = LoggerUtils.generateHash(this._timestamp);

  constructor(
    private readonly _appName: string,
    private readonly _level: LogLevel
  ) {
    this._logger = this._initializeWinston();
  }

  public logMaker = (message: string, level: LogLevel, context?: object) => {
    const timestamp = LoggerUtils.formatTimestamp(this._timestamp);

    const log: Log = {
      message,
      url: `${this._baseUrl}/${this._level}/log-events/${this._appName}$2520${timestamp}$2520${this._hash}`,
      lambdaName: 'Lambida',
      serviceName: this._appName,
      timestamp,
      context
    };

    console.log(log.url, 'URL');

    this._log(message, level, context);
    if (level === LogLevel.ERROR) this._sendSlackMessage(log);
  };

  private _log = (message: string, level: LogLevel, context?: object) => {
    this._logger.log(level, message, { context });
  };

  private _sendSlackMessage = async (log: Log) => {
    const sqsMessage = {
      MessageBody: JSON.stringify(log, null, 2)
    };

    const queueUrl = await ssmGetParameter(
      `/${process.env.STAGE}/slackbot/QUEUE_URL`
    );

    if (!queueUrl) {
      return;
    }

    const sqsInstance = new SqsHandler(queueUrl);
    await sqsInstance.sendMessage(sqsMessage);
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
      logGroupName: this._level,
      logStreamName: streamName,
      awsRegion: process.env.REGION ?? 'us-east-1',
      jsonMessage: true
    });
  };
}
