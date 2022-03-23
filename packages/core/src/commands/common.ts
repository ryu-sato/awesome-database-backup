/**
 * Define common processing for "backup", "restore", "list", and "prune" commands.
 */

import { Command, Option } from 'commander';
import { IStorageServiceClient } from '../interfaces/storage-service-client';
import { storageProviderType, generateStorageServiceClient } from '../factories/provider-factory';

/* Common command option types */
export declare interface ICommonCLIOption {
  awsRegion?: string
  awsAccessKeyId?: string,
  awsSecretAccessKey?: string,
  gcpProjectId?: string,
  gcpClientEmail?: string,
  gcpPrivateKey?: string,
  gcpServiceAccountKeyJsonPath?: string,
}

export function addStorageServiceClientOptions(command: Command): void {
  command
    /* AWS options */
    .option('--aws-region <AWS_REGION>', 'AWS Region')
    .addOption(new Option('--aws-access-key-id <AWS_ACCESS_KEY_ID>', 'Your IAM Access Key ID').env('AWS_ACCESS_KEY_ID'))
    .addOption(new Option('--aws-secret-access-key <AWS_SECRET_ACCESS_KEY>', 'Your IAM Secret Access Key').env('AWS_SECRET_ACCESS_KEY'))
    /* GCS options */
    .addOption(new Option('--gcp-project-id <GCP_PROJECT_ID>', 'GCP Project ID').env('GCLOUD_PROJECT'))
    .option('--gcp-private-key <GCP_PRIVATE_KEY>', 'GCP Private Key')
    .option('--gcp-client-email <GCP_CLIENT_EMAIL>', 'GCP Client Email')
    .addOption(new Option('--gcp-service-account-key-json-path <GCP_SERVICE_ACCOUNT_KEY_JSON_PATH>',
      'JSON file path to your GCP Service Account Key').env('GOOGLE_APPLICATION_CREDENTIALS'));
}

export function addStorageServiceClientGenerateHook(command: Command, storageServiceClientHolder: { storageServiceClient: IStorageServiceClient|null }): void {
  command
    .hook('preAction', (command: Command) => {
      const options = command.opts() as ICommonCLIOption;
      const [targetBucketUrlString] = command.args;

      const targetBucketUrl = new URL(targetBucketUrlString);
      const type = storageProviderType(targetBucketUrl);
      if (type == null) throw new Error(`Unknown storage provider type: ${type}`);

      storageServiceClientHolder.storageServiceClient = generateStorageServiceClient(type, options);
    });
}