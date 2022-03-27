import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import { testS3BucketURI, cleanTestS3Bucket } from './supports/s3rver-cleaner';

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
      --aws-endpoint-url http://s3.s3rver \
      --aws-region us-east-1 \
      --aws-access-key-id "S3RVER" \
      --aws-secret-access-key "S3RVER" \
      ${testS3BucketURI}/`;

    beforeEach(cleanTestS3Bucket);
    beforeEach(async() => {
      const awsCommand = '\
        AWS_ACCESS_KEY_ID="S3RVER" \
        AWS_SECRET_ACCESS_KEY="S3RVER" \
        aws \
        --endpoint-url http://s3.s3rver \
        --region us-east-1';
      await exec(`${awsCommand} s3 cp __tests__/fixtures/backup-20220327224212.tar.bz2 ${testS3BucketURI}/`);
    });

    it('list files in bucket', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('backup-20220327224212.tar.bz2'),
        stderr: '',
      });
    });
  });

  describe('when valid GCS options are specified', () => {
    // TODO
  });
});
