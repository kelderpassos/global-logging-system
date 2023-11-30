/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SSMClient,
  GetParametersByPathCommand,
  GetParameterCommand,
  GetParameterCommandOutput,
  GetParametersByPathCommandOutput
  // Parameter
} from '@aws-sdk/client-ssm';

export const ssmClient = new SSMClient({ region: 'us-east-1' });

export async function ssmParams(
  Path: string
): Promise<{ [key: string]: string }> {
  const command: GetParametersByPathCommand = new GetParametersByPathCommand({
    Path
  });

  const { Parameters /* NextToken */ }: GetParametersByPathCommandOutput =
    await ssmClient.send(command);

  if (!Parameters) return { chave: 'valor' };

  const result = Parameters.reduce((acc: any, curr) => {
    if (!curr.Name) return acc;

    const teste = curr.Name.replace(Path, '') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    acc[teste] = curr.Value;
    return acc;
  }, {});

  return result as Promise<{ [key: string]: string }>;
}

export async function ssmGetParameter(
  Name: string
): Promise<string | undefined> {
  const command = new GetParameterCommand({ Name });
  const result: GetParameterCommandOutput = await ssmClient.send(command);

  if (!result.Parameter) return;
  return result.Parameter.Value;
}
