import { Storage, StorageOptions, File } from '@google-cloud/storage';
import { basename, join } from 'path';
import {
  IStorageServiceClient,
  listGCSFilesOptions,
  GCSURI,
  GCSStorageServiceClientConfig,
} from './interfaces';

/**
 * Parse GCS's URI(start with "gs:")
 * ex. It'll break down "gs://bucket/folder/file" to {"bucket": "bucket", "filepath": "folder/file"}.
 * If it is not GCS's URL, return null.
 */
function _parseFilePath(path: string): GCSURI | null {
  /* GCS URI */
  if (path.startsWith('gs:')) {
    // https://regex101.com/r/QesT48/1
    const regexGCSUri = /^gs:\/\/([^/]+)\/?(.*)$/;
    try {
      const match = path.match(regexGCSUri);
      if (!match) return null;
      const [, bucket, filepath] = match;
      return { bucket, filepath };
    }
    catch (e: any) {
      return null;
    }
  }
  return null;
}

/**
 * Client to manipulate GCS buckets
 */
export class GCSStorageServiceClient implements IStorageServiceClient {

  name: string;

  client: Storage;

  constructor(config: GCSStorageServiceClientConfig) {
    /* If the configuration file does not exist, it is created temporarily from the config,
      and it will be deleted when process exit. */
    if (config.gcpProjectId == null || config.gcpClientEmail == null || config.gcpPrivateKey == null) {
      throw new Error('If you does not set "--gcp-service-account-key-json-path", '
                        + 'you will need to set all of "--gcp-project-id", "--gcp-client-email" and "--gcp-private-key".');
    }

    let storageconfig: StorageOptions;
    if (config.gcpServiceAccountKeyJsonPath) {
      storageconfig = {
        keyFilename: config.gcpServiceAccountKeyJsonPath,
      };
    }
    else {
      storageconfig = {
        projectId: config.gcpProjectId,
        credentials: {
          client_email: config.gcpClientEmail,
          // [MEMO] Converting escaped characters because newline codes cannot be entered in the commander argument.
          private_key: config.gcpPrivateKey?.replace(/\\n/g, '\n'),
        },
      };
      if (config.gcpEndpointUrl) {
        storageconfig.apiEndpoint = config.gcpEndpointUrl;
      }
    }

    this.name = 'GCS';
    this.client = new Storage(storageconfig);
  }

  exists(url: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.listFiles(url)
        .then((lists) => {
          resolve(lists.length > 0);
        })
        .catch(e => reject(e));
    });
  }

  listFiles(url: string, optionsRequired?: listGCSFilesOptions): Promise<string[]> {
    const gcsUri = _parseFilePath(url);
    if (gcsUri == null) return Promise.reject(new Error(`URI ${url} is not correct GCS's`));

    const defaultOption: listGCSFilesOptions = {
      exactMatch: true,
    };
    const options = optionsRequired ? { ...defaultOption, ...optionsRequired } : defaultOption;

    return new Promise((resolve, reject) => {
      const targetBucket = this.client.bucket(gcsUri.bucket);
      targetBucket.getFiles({ prefix: gcsUri.filepath })
        // getFiles() return like "[[File1],[File2],...]", so removed the outermost array
        .then(([matchedFiles]: File[][]) => {
          if (matchedFiles == null) return reject(new Error('Bucket#getFiles return null'));

          let files = matchedFiles;
          if (!url.endsWith('/')) {
            const exactFileMatcher = (it: File) => it.name === gcsUri.filepath;
            const prefixFileMatcher = (it: File) => it.name.startsWith(gcsUri.filepath);
            files = files.filter(options.exactMatch ? exactFileMatcher : prefixFileMatcher);
          }
          const filepaths = files.map(file => file.name);
          resolve(filepaths);
        })
        .catch(e => reject(e));
    });
  }

  deleteFile(url: string): Promise<void> {
    const gcsUri = _parseFilePath(url);
    if (gcsUri == null) return Promise.reject(new Error(`URI ${url} is not correct GCS's`));

    return new Promise((resolve, reject) => {
      const deleteTargetFile = this.client.bucket(gcsUri.bucket).file(gcsUri.filepath);
      deleteTargetFile.delete()
        .then(() => resolve())
        .catch(e => reject(e));
    });
  }

  copyFile(copySource: string, copyDestination: string): Promise<void> {
    const parseSourceResult = _parseFilePath(copySource);
    const parseDestinationResult = _parseFilePath(copyDestination);

    /* Upload local file to GCS */
    if (parseSourceResult == null && parseDestinationResult != null) {
      const destinationGCSUri = parseDestinationResult as GCSURI;
      return this.uploadFile(copySource, destinationGCSUri);
    }
    /* Download GCS object and save as local file */
    if (parseSourceResult != null && parseDestinationResult == null) {
      const sourceGCSUri = parseSourceResult as GCSURI;
      return this.downloadFile(sourceGCSUri, copyDestination);
    }
    /* Copy GCS object and save as another GCS object */
    if (parseSourceResult != null && parseDestinationResult != null) {
      const sourceGCSUri = parseSourceResult as GCSURI;
      const destinationGCSUri = parseDestinationResult as GCSURI;
      return this.copyFileOnRemote(sourceGCSUri, destinationGCSUri);
    }

    return Promise.reject(new Error('At least the copy source or destination must be an GCS endpoint.'));
  }

  uploadFile(sourceFilePath: string, destinationGCSUri: GCSURI): Promise<void> {
    return new Promise((resolve, reject) => {
      const destinationBucket = this.client.bucket(destinationGCSUri.bucket);
      const destination = join(destinationGCSUri.filepath, basename(sourceFilePath));
      destinationBucket.upload(sourceFilePath, { destination })
        .then(() => resolve())
        .catch(e => reject(e));
    });
  }

  downloadFile(sourceGCSUri: GCSURI, destinationFilePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sourceFile = this.client.bucket(sourceGCSUri.bucket).file(sourceGCSUri.filepath);
      const options = {
        destination: destinationFilePath,
      };
      sourceFile.download(options)
        .then(() => resolve())
        .catch(e => reject(e));
    });
  }

  copyFileOnRemote(sourceGCSUri: GCSURI, destinationGCSUri: GCSURI): Promise<void> {
    return new Promise((resolve, reject) => {
      const sourceFile = this.client.bucket(sourceGCSUri.bucket).file(sourceGCSUri.filepath);
      const destinationFile = this.client.bucket(destinationGCSUri.bucket).file(destinationGCSUri.filepath);
      sourceFile.copy(destinationFile)
        .then(() => resolve())
        .catch(e => reject(e));
    });
  }

}

export default GCSStorageServiceClient;
