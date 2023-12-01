import { Request } from 'express';

type Metadata = {
  httpStatusCode: number;
  requestId: string;
  attempts: number;
  totalRetryDelay: number;
};

type RequestData = {
  host: string | undefined;
  userAgent: string | undefined;
  ip: string | string[] | undefined;
  method: string;
  originalUrl: string;
};

export type ErrorType = {
  name: string;
  $fault: string;
  $metadata: Metadata;
  message: string;
};

export class CustomError {
  public name: string;
  public fault: string;
  public metadata: Metadata;
  public request: RequestData;
  public message: string;

  constructor(errorStack: ErrorType, requestData: Request) {
    this.name = errorStack.name;
    this.fault = errorStack.$fault;
    this.message = errorStack.message;
    this.metadata = errorStack.$metadata;
    this.request = this.buildRequestAttribute(requestData);
  }

  private buildRequestAttribute = (requestData: Request) => {
    return {
      host: requestData.headers.host,
      userAgent: requestData.headers['user-agent'],
      ip: requestData.ip,
      method: requestData.method,
      originalUrl: requestData.originalUrl
    };
  };
}
