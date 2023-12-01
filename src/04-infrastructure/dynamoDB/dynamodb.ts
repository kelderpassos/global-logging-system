import { DynamoDB } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocument,
  QueryCommandInput,
  QueryCommandOutput
} from '@aws-sdk/lib-dynamodb';

const marshallOptions = {
  convertEmptyValues: false, // default
  removeUndefinedValues: true, // default
  convertClassInstanceToMap: true // for data instance to be converted into object
};

const unmarshallOptions = {
  wrapNumbers: false // default
};

const dynamoDbClient = new DynamoDB({
  region: process.env.AWS_REGION ?? 'us-east-1'
});

const dynamo = DynamoDBDocument.from(dynamoDbClient, {
  marshallOptions,
  unmarshallOptions
});

export class DynamoTable {
  readonly client = dynamo;

  constructor(readonly tableName: string) {}

  async query(params: Partial<QueryCommandInput>): Promise<QueryCommandOutput> {
    const result = await this.client.query({
      ...params,
      TableName: this.tableName
    });
    return result;
  }

  async QueryWithPagination(params: Partial<QueryCommandInput>) {
    const allData = [];

    const result = await this.query(params);
    let lastKey: unknown = result.LastEvaluatedKey;

    if (!result.Items) return;

    for (const element of result.Items) {
      const rawData = element.data;
      allData.push(rawData);
    }

    while (lastKey) {
      params.ExclusiveStartKey = lastKey;
      // eslint-disable-next-line no-await-in-loop
      const nextPage = await this.query(params);
      lastKey = nextPage.LastEvaluatedKey ?? false;

      if (!nextPage.Items) return;

      for (const element of nextPage.Items) {
        const rawData = element.data;
        allData.push(rawData);
      }
    }

    return allData;
  }
}
