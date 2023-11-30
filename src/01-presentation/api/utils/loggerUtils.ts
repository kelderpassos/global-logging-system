import crypto from 'crypto';

export class LoggerUtils {
  public static formatTimestamp = (timestamp: string) =>
    timestamp
      .replace('T', '')
      .replaceAll(':', '-')
      .replaceAll(' ', '-')
      .split('.')[0];

  public static generateHash = (timestamp: string) => {
    const formattedTimestamp = LoggerUtils.formatTimestamp(timestamp);
    return crypto.createHash('md5').update(formattedTimestamp).digest('hex');
  };

  public static generateLogStreamName = (
    appName: string,
    timestamp: string
  ): string => {
    const formattedTimestamp = LoggerUtils.formatTimestamp(timestamp);
    const hash = LoggerUtils.generateHash(timestamp);

    return `${appName} ${formattedTimestamp} ${hash}`;
  };
}
