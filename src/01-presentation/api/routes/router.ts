import { Router, Response, Request } from 'express';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { ssmGetParameter } from '../../../04-infrastructure/ssm/ssmFunctions';
import { DynamoTable } from '../../../04-infrastructure/dynamoDB/dynamodb';
import { CustomError, ErrorType } from '../../../03-model/utils/customError';
import { ErrorLogger } from '../../../03-model/logger/errorLogger';
import { LogLevel } from '../../../03-model/utils/logLevel.enum';

process.env.REGION = 'us-east-1';
process.env.AWS_PROFILE = 'bigtrade-sbx';
process.env.SSMPATH = `agdesk-platform-infra-sbx`;
process.env.STAGE = 'sbx';
process.env.GMT_TABLE_NAME = 'agdesk-analysis-infra-sbx-gmt-lead-table';

export const router = Router();

const log = new ErrorLogger('agdesk-checker-service');

router.get('/all', async (req: Request, res: Response) => {
  try {
    const gmtTableName = await ssmGetParameter(
      `/${process.env.GMT_TABLE_NAME}/`
    );

    if (!gmtTableName) return;
    const table = new DynamoTable(gmtTableName);

    const queryParams: Partial<QueryCommandInput> = {
      IndexName: 'type_index',
      ExpressionAttributeValues: {
        ':type': 'flag'
      },
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      KeyConditionExpression: '#type = :type'
    };

    const flags = await table.QueryWithPagination(queryParams);

    return res.status(200).json(flags);
  } catch (error: unknown) {
    const errorObject = error as ErrorType;
    const stack = new CustomError(errorObject, req);

    log.logMaker(stack.request.originalUrl, LogLevel.ERROR, stack);
    return res.status(stack.metadata.httpStatusCode).json(stack);
  }
});
