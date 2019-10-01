
//const S3 = require('aws-sdk/clients/s3')
const IPFSRepo = require('ipfs-repo')

// A mock lock
const notALock = {
  getLockfilePath: () => { },
  lock: (_) => notALock.getCloser(),
  getCloser: (_) => ({
    close: () => { }
  }),
  locked: (_) => false
}
/**
 * A convenience method for creating an S3 backed IPFS repo
 * @param {httpStore} S3Store
 * @param {RepoOptions} options
 * @param {S3Options} s3Options
 * @returns {IPFSRepo}
 */
const createRepo = (webdavStore, options, storeConfig) => {

  let {
    path,
    createIfMissing,
    lock
  } = options

  // If no lock is given, create a mock lock
  lock = lock || notALock

  return new IPFSRepo(path, {
    storageBackends: {
      root: webdavStore,
      blocks: webdavStore,
      keys: webdavStore,
      datastore: webdavStore
    },
    storageBackendOptions: {
      root: storeConfig,
      blocks: storeConfig,
      keys: storeConfig,
      datastore: storeConfig
    },
    lock: lock
  })
}

module.exports = createRepo