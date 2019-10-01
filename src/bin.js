
const IPFS = require('ipfs')
const Repo = require('ipfs-repo')
const { createRepo } = require('.')
const os = require('os')
const Path = require('path')

const IDatastore = require('interface-datastore')
const sortAll = IDatastore.utils.sortAll
const Key = IDatastore.Key
const Errors = IDatastore.Errors

const hRepo = createRepo({
    path: Path.join(os.homedir(), '.jsipfs')
},
{
    url: "http://localhost:8000",
    options: {

    }
});
(async ()=> {
    //await hRepo.open();
    //await hRepo.init({});

    //console.log(await hRepo.datastore.put(new Key("/d"), Buffer.from("hello")))
    //console.log(await hRepo.datastore.get(new Key("/d")))
    let node = new IPFS({
        repo: hRepo,
        init: true,
        start: true
    })
    
})()
