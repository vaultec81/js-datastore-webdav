const IDatastore = require('interface-datastore')
const sortAll = IDatastore.utils.sortAll
const Key = IDatastore.Key
const Errors = IDatastore.Errors
const createClient = require("webdav");

class webdavApi {
    constructor(client) {
        this.client = client;
    }
    /**
     * 
     * @param {Key} key 
     * @param {Buffer} val 
     */
    async putFile(key, val) {
        await this.client.putFileContents(key.toString(), val);
    }
    /**
     * 
     * @param {Key} key
     * @returns {Buffer} 
     */
    async getFile(key) {
        try {
            return await this.client.getFileContents(key.toString());
        } catch(err) {
            throw Errors.notFoundError(err)
        }
        
    }
    async deleteFile(key) {
        await this.client.delete(key.toString())
    }
    async list() {
        var array = await this.client.getDirectoryContents("/");
        let out = [];
        for (var value in array) {
            out.push(value.filename)
        }
        return out;
    }
    async has(key) {        
        try {
            await client.stat(key.toString().replace("/", "."))
        } catch(err) {
            return false
        }
    }
    static openFrom(url, options) {
        return httpapi(createClient.createClient(url, options))
    }
}
module.exports = webdavApi;