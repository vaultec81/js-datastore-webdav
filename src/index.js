const webdavApi = require("./webdavapi")
const createRepo = require('./h-repo')
const { createClient } = require("webdav");


const IDatastore = require('interface-datastore')
const sortAll = IDatastore.utils.sortAll
const Key = IDatastore.Key
const Errors = IDatastore.Errors

class HttpDatabase {
    constructor(path, opts /* : S3DSInputOptions */) {
        this.path = path;
        this.opts = opts
        const {
            createIfMissing = false,
            folderId,
        } = opts;

        //assert(typeof folderId === 'string', `An Google drive instance with a predefined folderId must be supplied. ${folderId}`)
        //assert(typeof createIfMissing === 'boolean', `createIfMissing must be a boolean but was (${typeof createIfMissing}) ${createIfMissing}`)
        this.createIfMissing = createIfMissing;
        
        this.api = new webdavApi(createClient(opts.url, opts.options))
    }
    /**
     * Store the given value under the key.
     *
     * @param {Key} key
     * @param {Buffer} val
     * @returns {Promise}
     */
    async put(key /* : Key */, val /* : Buffer */) /* : Promise */ {
        console.log(key)
        try {
            return await this.api.putFile(key.toString(), val)
        } catch (err) {
            throw Errors.dbWriteFailedError(err)
        }
    }
    /**
     * Read from google drive.
     *
     * @param {Key} key
     * @returns {Promise<Buffer>}
     */
    async get(key /* : Key */) /* : Promise<Buffer> */ {
        console.log(key.toString())
        try {
            const data = await this.api.getFile(key)
            // If a body was returned, ensure it's a Buffer
            return data ? Buffer.from(data) : null
        } catch (err) {
            if (err.statusCode === 404) {
                throw Errors.notFoundError(err)
            }
            throw Errors.notFoundError(err)
        }

    }
    /**
     * Check for the existence of the given key.
     *
     * @param {Key} key
     * @returns {Promise<bool>}
     */
    async has(key /* : Key */) /* : Promise<bool> */ {
        try {
            return await this.api.has(key);
        } catch (err) {
            throw Errors.notFoundError(err)
        }
    }
    /**
     * Delete the record under the given key.
     *
     * @param {Key} key
     * @returns {Promise}
     */
    async delete(key /* : Key */) /* : Promise */ {
        try {
            await this.api.deleteFile(key)
        } catch (err) {
            throw Errors.dbDeleteFailedError(err)
        }
    }
    /**
     * Create a new batch object.
     *
     * @returns {Batch}
     */
    batch() /* : Batch<Buffer> */ {

        const puts = []
        const deletes = []
        return {
            put(key /* : Key */, value /* : Buffer */) /* : void */ {
                puts.push({ key: key, value: value })
            },
            delete(key /* : Key */) /* : void */ {
                deletes.push(key)
            },
            commit: () /* : Promise */ => {
                const putOps = puts.map((p) => this.put(p.key, p.value))
                const delOps = deletes.map((key) => this.delete(key))
                return Promise.all(putOps.concat(delOps))
            }
        }
    }
    /**
       * Recursively fetches all keys from google drive
       * @param {Object} params
       * @returns {Iterator<Key>}
       */
    async * _listKeys(params /* : { Prefix: string, StartAfter: ?string } */) {
        let data
        try {
            data = await this.api.list()
            //console.log(data)
        } catch (err) {
            throw new Error(err)
        }

        for (const d in data) {
            // Remove the path from the key
            //yield new Key(d.Key.slice(this.path.length), false)
            yield new Key(d)
        }
    }
    /**
     * Query the store.
     *
     * @param {Object} q
     * @returns {Iterable}
     */
    query(q /* : Query<Buffer> */) /* : QueryResult<Buffer> */ {
        const prefix = path.join(this.path, q.prefix || '')

        let values = true
        if (q.keysOnly != null) {
            values = !q.keysOnly
        }

        // Get all the keys via list object, recursively as needed
        const params /* : Object */ = {
            Prefix: prefix
        }
        let it = this._listKeys(params)

        if (q.prefix != null) {
            it = filter(k => k.toString().startsWith(q.prefix), it)
        }

        it = map(async (key) => {
            const res /* : QueryEntry<Buffer> */ = { key }
            if (values) {
                // Fetch the object Buffer from s3
                res.value = await this.get(key)
            }
            return res
        }, it)

        if (Array.isArray(q.filters)) {
            it = q.filters.reduce((it, f) => filter(f, it), it)
        }

        if (Array.isArray(q.orders)) {
            it = q.orders.reduce((it, f) => sortAll(it, f), it)
        }

        if (q.offset != null) {
            let i = 0
            it = filter(() => i++ >= q.offset, it)
        }

        if (q.limit != null) {
            it = take(q.limit, it)
        }

        return it
    }
    /**
       * This will check google drive to ensure access and existence
       *
       * @returns {Promise}
       */
    async open() /* : Promise */ {
        try {
            await this.api.list(this.folderId)
        } catch (err) {
            if (err.statusCode === 404) {
                return this.put(new Key('lock', false), Buffer.from(''))
            }
            throw Errors.dbOpenFailedError(err)
        }

    }
    close() {

    }
}
module.exports = exports = {
    HttpDatabase: HttpDatabase,
    createRepo: (...args) => {
        return createRepo(HttpDatabase, ...args)
    }
};