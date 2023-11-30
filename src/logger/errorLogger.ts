import { LogLevel } from '../03-model/logLevel.enum';
import { Logger } from './logger';

export class ErrorLogger extends Logger {
  constructor(appName: string) {
    super(appName, LogLevel.ERROR);
  }
}
