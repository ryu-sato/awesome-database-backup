# prune

Prune backuped files from Amazon S3 or Google Cloud Storage. You can set a custom S3 endpoint to use S3 based services like DigitalOcean Spaces instead of Amazon S3.

## Usage


### How to prune

```
Usage: prune [options] <TARGET_BUCKET_URL>

Arguments:
  TARGET_BUCKET_URL                                                        URL of target bucket

Options:
  -V, --version                                                            output the version number
  --aws-endpoint-url <AWS_ENDPOINT_URL>                                    URL to send the request to
  --aws-region <AWS_REGION>                                                AWS Region
  --aws-access-key-id <AWS_ACCESS_KEY_ID>                                  Your IAM Access Key ID (env: AWS_ACCESS_KEY_ID)
  --aws-secret-access-key <AWS_SECRET_ACCESS_KEY>                          Your IAM Secret Access Key (env: AWS_SECRET_ACCESS_KEY)
  --gcp-endpoint-url <GCP_ENDPOINT_URL>                                    URL to send the request to
  --gcp-project-id <GCP_PROJECT_ID>                                        GCP Project ID (env: GCLOUD_PROJECT)
  --gcp-private-key <GCP_PRIVATE_KEY>                                      GCP Private Key
  --gcp-client-email <GCP_CLIENT_EMAIL>                                    GCP Client Email
  --gcp-service-account-key-json-path <GCP_SERVICE_ACCOUNT_KEY_JSON_PATH>  JSON file path to your GCP Service Account Key (env: GOOGLE_APPLICATION_CREDENTIALS)
  --backupfile-prefix <BACKUPFILE_PREFIX>                                  Prefix of backup file. (default: "backup")
  --delete-divide <DELETE_DIVIDE>                                          delete divide (default: 3)
  --delete-target-days-left <DELETE_TARGET_DAYS_LEFT>                      How many days ago to be deleted (default: 4)
  -h, --help                                                               display help for command
```