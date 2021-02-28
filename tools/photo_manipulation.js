const axios = require('axios')
const fs = require('fs')

const config = JSON.parse(fs.readFileSync('./auth/config.json'))
const { turu_link, turukey } = config


/**
 * Fisheye image manipulation, API Powered by Turu API
 * @param {String} image
 * @returns {Array}
 */
const fisheye = (image) => new Promise ((resolve, reject) => {
    if (!image) throw new Error('parameter imahes cannot be empty!')
    axios.get(`${turu_link}/tools/fisheye?apikey=${turukey}&url=${image}`)
        .then((result) => resolve(result.data))
        .catch((err) => reject(err))
})


/**
 * Photo cartooon image manipulation, API Powered by Turu API
 * @param {String} image
 * @returns {Array}
 */
const cartoon = (image) => new Promise ((resolve, reject) => {
    if (!image) throw new Error('parameter image cannot be empty!')
    axios.get(`${turu_link}/tools/photo_cartoon?apikey=${turukey}&url=${image}`)
        .then((result) => resolve(result.data))
        .catch((err) => reject(err))
})


/**
 * Photo Comic, image manipulation. API Powered by Turu API
 * @param {String} image
 * @returns {Array}
 */
const comic = (image) => new Promise ((resolve, reject) => {
    axios.get(`${turu_link}/tools/photo_comic?apikey=${turukey}&url=${image}`)
        .then((result) => resolve(result.data))
        .catch((err) => reject(err))
})




module.exports = {
    fisheye,
    cartoon,
    comic
}