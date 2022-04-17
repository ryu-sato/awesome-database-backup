import { EOL } from 'os';
import { StorageServiceClientCommand } from './common';
import loggerFactory from '../logger/factory';
import { IListCommandOption } from './interfaces';

const logger = loggerFactory('mongodb-awesome-core');

/**
 * Define actions, options, and arguments that are commonly required for list command from the CLI, regardless of the database type.
 *
 * Call setListAction(), addListOptions() and setListArgument().
 *
 * If necessary, you can customize it by using the Command's methods, such as adding options by using option() and help messages by using addHelpText().
 */
export class ListCommand extends StorageServiceClientCommand {

  async list(targetBucketUrl: URL): Promise<void> {
    if (this.storageServiceClient == null) throw new Error('URL scheme is not that of a supported provider.');

    const files = await this.storageServiceClient.listFiles(targetBucketUrl.toString());
    if (files.length > 0) {
      logger.info('There are files below in bucket:');
      logger.info(files.join(EOL));
    }
  }

  addListOptions(): this {
    return this
      .addStorageOptions();
  }

  setListAction(): this {
    const action = async(options: IListCommandOption) => {
      try {
        const targetBucketUrl = new URL(options.targetBucketUrl);
        await this.list(targetBucketUrl);
      }
      catch (e: any) {
        logger.error(e);
        throw e;
      }
    };

    return this
      .saveStorageClientInAdvance()
      .action(action);
  }

}

export { IListCommandOption } from './interfaces';
export default ListCommand;
