const axios = require('axios')
const fs = require('fs')


// load the configuration files
const config = JSON.parse(fs.readFileSync('./auth/config.json'))
const { turu_link, turukey } = config



/**
 * Jadwal Bola, API Powered by Turu API
 * @param {type}
 * @returns {Array}
 */
const jadwalbola = (type) => new Promise ((resolve, reject) => {
    if (type === undefined) {
        type = 'today'
    } else {
        type = type
    }
    
    axios.get(`${turu_link}/tools/jadwalbola?apikey=${turukey}&type=${type}`)
        .then((result) => resolve(result.data))
        .catch((err) => reject(err))
})


/**
 * Find music lyric, API Powered by Turu API
 * @param {String} q
 * @returns {Array}
 */
const lirik = (q) => new Promise ((resolve, reject) => {
    axios.get(`${turu_link}/tools/lirik?apikey=${turukey}&query=${q}`)
        .then((result) => resolve(result.data))
        .catch((err) => reject(err))
})


/**
 * Search chord music
 * @param {String} q
 * @returns {Array}
 */
const chord = (q) => new Promise ((resolve, reject) => {
    axios.get(`${turu_link}/tools/chord?apikey=${turukey}&query=${q}`)
        .then((result) => resolve(result.data))
        .catch((err) => reject(err))
})




module.exports = {
    jadwalbola,
    lirik,
    chord
}