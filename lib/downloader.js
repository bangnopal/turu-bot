/** DEPENDENCY */
const axios = require('axios')
const fs  = require('fs')
/** END */


/**LOAD CONFIGURATION FILE */
const config = JSON.parse(fs.readFileSync('./auth/config.json'))
const setting  = JSON.parse(fs.readFileSync('./auth/setting.json'))

const { turukey, turu_link } = config
/** END */



/**
 * Joox Downloader Powered by Turu API
 * @param {String} query
 * @param {String} apikey
 * @returns {JSON}
 */
const joox = async (query) => new Promise ((resolve, reject) => {
    console.log(`Searching music ${query} on joox....`)
    axios.get(`${turu_link}/dl/joox?apikey=${turukey}&query=${query}`)
        .then((result) => resolve(result.data))
        .catch((e) => reject(e))
})



module.exports = {
    joox
}