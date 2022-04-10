import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';
import {
  cleanTestS3Bucket,
  uploadFixtureToTestS3Bucket,
  testGCSBucketURI,
  cleanTestGCSBucket,
  uploadFixtureToTestGCSBucket,
} from '@awesome-backup/storage-service-test';
import {
  cleanTestPG,
  listTableNamesInTestPG,
} from '@awesome-backup/postgresql-test';

const exec = promisify(execOriginal);

const execRestoreCommand = 'yarn run ts-node src/bin/restore';

describe('restore', () => {
  describe('when option --help is specified', () => {
    const commandLine = `${execRestoreCommand} --help`;
    it('show help messages', async() => {
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringContaining('Usage:'),
        stderr: '',
      });
    });
  });

  describe('when no option is specified', () => {
    const commandLine = `${execRestoreCommand}`;
    it('throw error message', async() => {
      await expect(exec(commandLine)).rejects.toThrowError(
        /missing required argument 'TARGET_BUCKET_URL'/,
      );
    });
  });

  describe('when valid S3 options are specified', () => {
    const bucketURI = 's3://test/';
    const objectURI = `${bucketURI}backup-20220402000000.tar.bz2`;
    const commandLine = `PGPASSWORD="password" \
      ${execRestoreCommand} \
      --aws-endpoint-url http://s3.minio:9000 \
      --aws-region us-east-1 \
      --aws-access-key-id "minioadmin" \
      --aws-secret-access-key "minioadmin" \
      --restore-tool-options "--host postgres --username postgres" \
      ${objectURI}`;

    beforeEach(cleanTestS3Bucket);
    beforeEach(cleanTestPG);
    beforeEach(async() => {
      await uploadFixtureToTestS3Bucket('backup-20220402000000.tar.bz2'); // includes 'dummy' table
    });

    it('restore PostgreSQL in bucket', async() => {
      expect(await listTableNamesInTestPG()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.js started at .* ===/),
        stderr: '',
      });
      expect(await listTableNamesInTestPG()).toEqual(['dummy']);
    });
  });

  describe('when valid GCS options are specified', () => {
    const objectURI = `${testGCSBucketURI}/backup-20220402000000.tar.bz2`;
    const commandLine = `PGPASSWORD="password" \
      ${execRestoreCommand} \
      --gcp-endpoint-url http://fake-gcs-server:4443 \
      --gcp-project-id valid_project_id \
      --gcp-client-email valid@example.com \
      --gcp-private-key valid_private_key \
      --restore-tool-options "--host postgres --username postgres" \
      ${objectURI}`;

    beforeEach(cleanTestGCSBucket);
    beforeEach(cleanTestPG);
    beforeEach(async() => {
      await uploadFixtureToTestGCSBucket('backup-20220402000000.tar.bz2'); // includes 'dummy' table
    });

    it('restore PostgreSQL in bucket', async() => {
      expect(await listTableNamesInTestPG()).toEqual([]);
      expect(await exec(commandLine)).toEqual({
        stdout: expect.stringMatching(/=== restore.js started at .* ===/),
        stderr: '',
      });
      expect(await listTableNamesInTestPG()).toEqual(['dummy']);
    });
  });
});