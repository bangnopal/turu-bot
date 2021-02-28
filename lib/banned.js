const fs = require('fs-extra')
const toMs = require('ms')
const dateTime = require('node-datetime')

const date = dateTime.create().format('d-m-Y')


/**
 * validate is user has been banned from bot or not? return boolean (true or false)
 * @param {String} userId
 * @param {String} _data
 */
const thisBanned = (userId, _data) => {
    let status = false
    Object.keys(_data).forEach((i) => {
        if (_data[i].nomor === userId) {
            if (_data[i].expired === 'PERMANENT' || _data[i].expired > Date.now()) {
                status = true
            }
        }
    })
    return status
}


/**
 * Add user to bannedList database
 * @param {String} userId
 * @param {String} expired
 * @param {Object} _data
 */
const addBannedList = (userId, expired, _data) => {
    let success = false
    if (expired === undefined) {
        expired = 'PERMANENT'
    } else {
        expired = expired
    }
    
    let expired_at = 'PERMANENT'
    
    if (expired === 'PERMANENT') {
        expired_at = 'PERMANENT'
    } else {
        expired_at = Date.now() + toMs(expired)
    }
    
    const obj = {
        nomor: userId,
        expired: expired_at
    }
    
    _data.push(obj)
    fs.writeFileSync('./database/banned.json', JSON.stringify(_data))
}


/**
 * Delete user from bannedList
 * @param {String} userId
 * @param {Object} _data
 */
const unBanned = (userId, _data) => {
    Object.keys(_data).forEach((i) => {
        if (_data[i].nomor === userId) {
            _data.splice(i, 1)
            fs.writeFileSync('./database/banned.json', JSON.stringify(_data))
        }
    })
    
    return true
}



module.exports = {
    thisBanned,
    addBannedList,
    unBanned
}