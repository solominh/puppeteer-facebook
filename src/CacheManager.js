const Cryptr = require('cryptr');
const fs = require('fs-extra')

 function createCacheManager(filePath, secret) {
  const cryptr = new Cryptr(secret);

  const getCache = async () => {
    let cache;
    try {
      const encryptedCache = await fs.readFile(filePath);
      const str = cryptr.decrypt(encryptedCache);
      cache = JSON.parse(str);
      return cache;
    } catch (error) {
      console.log(error);
      cache = {};
      return cache;
    }
  };

  const saveCache = async cache => {
    try {
      const encryptedCache = cryptr.encrypt(JSON.stringify(cache));
      await fs.outputFile(filePath, encryptedCache);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  return {
    getCache,
    saveCache,
  };
}

module.exports={
    createCacheManager
}