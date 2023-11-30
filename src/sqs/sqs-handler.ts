import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput
} from '@aws-sdk/client-sqs';
import { Message } from './message';

const client = new SQSClient({
  region: process.env.AWS_REGION ?? 'us-east-1'
});

export class SqsHandler {
  readonly sqs = client;

  constructor(readonly sqsUrl: string) {}

  async sendMessage(message: Message) {
    const params: SendMessageCommandInput = {
      MessageBody: message.MessageBody,
      MessageGroupId: 'chatbot-slack',
      QueueUrl: this.sqsUrl,
      MessageDeduplicationId: Math.random().toString(36).substring(2, 15)
    };

    const command = new SendMessageCommand(params);

    return client.send(command);
  }
}
