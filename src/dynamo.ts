import 'dotenv/config';

import DynamoDB from 'aws-sdk/clients/dynamodb';

export const dynamo = new DynamoDB();
export const documents = new DynamoDB.DocumentClient();
export const tableName = 'OnlineCheckersPlatform';
