import { Router, Response, Request } from 'express';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { Logger } from '../../../logger/logger';
import { ssmGetParameter } from '../../../ssm/ssmParams';
import { DynamoTable } from '../../dynamoDB/dynamodb';
import { CustomError, ErrorType } from '../utils/customError';

process.env.REGION = 'us-east-1';
process.env.AWS_PROFILE = 'bigtrade-sbx';
process.env.SSMPATH = `agdesk-platform-infra-sbx`;
process.env.STAGE = 'sbx';
process.env.GMT_TABLE_NAME = 'agdesk-analysis-infra-sbx-gmt-lead-table';

export const router = Router();

const logger = new Logger('agdesk-checker-service', 'logging-system-test');

router.get('/200', (req: Request, res: Response): Response => {
  logger.info('Isto é um teste');

  return res.status(200).json({ message: 'foi' });
});

router.get('/500', (req: Request, res: Response): Response => {
  logger.error('Isto é um erro');
  return res.sendStatus(500);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
router.get('/error', (_req: Request, res: Response) => {
  logger.error('error', new Error('Isto é um erro'));

  return res.status(500).json({ messagem: 'testre' });
});

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

    logger.error(stack.request.originalUrl, stack);
    return res.status(stack.metadata.httpStatusCode).json(stack);
  }
});
