import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import {
  s3ClientConfig,
  testS3BucketURI,
  cleanTestS3Bucket,
  uploadFixtureToTestS3Bucket,
  storageConfig,
  testGCSBucketURI,
  cleanTestGCSBucket,
  uploadFixtureToTestGCSBucket,
} from '@awesome-backup/storage-service-test';

const exec = promisify(execOriginal);

const execListCommand = 'yarn run ts-node src/bin/list';

describe('list', () => {
  describe('when option --help is specified', () => {
    const commandLine = `${execListCommand} --help`;
    it('show help messages', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('Usage:'),
        stderr: '',
      });
    });
  });

  describe('when no option is specified', () => {
    const commandLine = `${execListCommand}`;
    it('throw error message', async() => {
      await expect(exec(commandLine)).rejects.toThrowError(
        /missing required argument 'TARGET_BUCKET_URL'/,
      );
    });
  });

  describe('when valid S3 options are specified', () => {
    const commandLine = `${execListCommand} \
      --aws-endpoint-url ${s3ClientConfig.endpoint} \
      --aws-region ${s3ClientConfig.region} \
      --aws-access-key-id ${s3ClientConfig.credentials.accessKeyId} \
      --aws-secret-access-key ${s3ClientConfig.credentials.secretAccessKey} \
      ${testS3BucketURI}/`;

    beforeEach(cleanTestS3Bucket);
    beforeEach(async() => {
      await uploadFixtureToTestS3Bucket('backup-20220327224212.tar.bz2');
    });

    it('list files in bucket', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('backup-20220327224212.tar.bz2'),
        stderr: '',
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    const commandLine = `${execListCommand} \
      --gcp-endpoint-url ${storageConfig.apiEndpoint} \
      --gcp-project-id ${storageConfig.projectId} \
      --gcp-client-email ${storageConfig.credentials.client_email} \
      --gcp-private-key ${storageConfig.credentials.private_key} \
      ${testGCSBucketURI}/`;

    beforeEach(cleanTestGCSBucket);
    beforeEach(async() => {
      await uploadFixtureToTestGCSBucket('backup-20220327224212.tar.bz2');
    });

    it('list files in bucket', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('backup-20220327224212.tar.bz2'),
        stderr: '',
      });
    });
  });
});
