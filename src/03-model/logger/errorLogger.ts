import { LogLevel } from '../utils/logLevel.enum';
import { Logger } from './logger';

export class ErrorLogger extends Logger {
  constructor(appName: string) {
    super(appName, LogLevel.ERROR);
  }
}
