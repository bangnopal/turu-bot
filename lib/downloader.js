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
 * @returns {Array}
 */
const joox = async (query) => new Promise ((resolve, reject) => {
    console.log(`Start searching music ${query} on Joox....`)
    axios.get(`${turu_link}/dl/joox?apikey=${turukey}&query=${query}`)
        .then((result) => resolve(result.data))
        .catch((e) => reject(e))
})


/**
 * Soundcloud play music
 * @param {String} query
 * @returns {Array}
 */
const soundcloud = async (query) => new Promise ((resolve, reject) => {
    console.log(`Start searching music ${query} on Soundcloud....`)
    axios.get(`${turu_link}/dl/scdlplay?apikey=${turukey}&query=${query}`)
        .then((result) => resolve(result.data))
        .catch((err) => reject(err))
})


/**
 * Drakor scraper, Powered by Turu API
 * @param {String} query
 * @returns {Array}
 */
const drakor = async (query) => new Promise((resolve, reject) => {
    console.log(`Searching drakor ${query}`)
    axios.get(`${turu_link}/dl/drakor?apikey=${turukey}&query=${query}`)
        .then((result) => resolve(result.data))
        .catch((err) => reject(err))
})


/**
 * Tiktok downloader, Powered by Turu API
 * @param {String} link
 * @returns {Array}
 */
const tiktok = async (link) => new Promise ((resolve, reject) => {
    console.log('Downloading tiktok media....')
    axios.get(`${turu_link}/dl/tiktok?apikey=${turukey}&url=${link}`)
        .then((result) => resolve(result.data))
        .catch((err) => reject(err))
})


/**
 * Instagram TV Downloader, API Powered by Turu API
 * @param {String} link
 * @returns {Array}
 */
const igtv = async (link) => new Promise ((resolve, reject) => {
    axios.get(`${turu_link}/dl/igtv?apikey=${turukey}&url=${link}`)
        .then((result) => resolve(result.data))
        .catch((err) => reject(err))
})


/**
 * Youtube MP4 & MP3 Downloader, API Powered by Turu API
 * @param {String} link
 * @returns {Array}
 */
const youtube = (link) => new Promise ((resolve, reject) => {
    console.log('Fetching youtube metadata...')
    axios.get(`${turu_link}/dl/youtube?apikey=${turukey}&url=${link}`)
        .then((result) => resolve(result.data))
        .catch((err) => reject(err))
})
 


module.exports = {
    joox,
    soundcloud,
    drakor,
    tiktok,
    igtv,
    youtube
}