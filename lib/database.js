const fs = require('fs-extra')
const toMs = require('ms')
const dateTime = require('node-datetime')

const date = dateTime.create().format('d-m-Y')

const setting = JSON.parse(fs.readFileSync('./auth/setting.json'))


/**
 * Validate user is premium or reguler
 * @param {String} userId 
 * @param {*} _data
 * @returns {Boolean}
 */
const thisPremium = (userId, _data) => {
    let status = false
    Object.keys(_data).forEach((i) => {
        if (_data[i].userId === userId) {
            if (_data[i].expired > Date.now()) {
                status = true
            }
        }
    })
    return status
}


/**
 * Add premium user to database
 * @param {String} userId 
 * @param {String} expired
 * @param {*} _data
 * @returns {Boolean} 
 */
const addPremium = (userId, expired, _data) => {
    const obj = { userId: userId, register: date, expired: Date.now() + toMs(expired) }
    _data.push(obj)
    fs.writeFileSync('./database/premium.json', JSON.stringify(_data))
}


/**
 * Check if user is registered or not
 * @param {String} userId
 * @param {Object} _data
 * @returns {Boolean}
 */
const isRegistered = (userId, _data) => {
    let isReg = false
    Object.keys(_data).forEach((i) => {
        if (_data[i].userId === userId) {
            isReg = true
        }
    })
    return isReg
}


/**
 * Adding user to database
 * @param {String} userId
 * @param {String} pushname
 * @param {Object} _data
 */
const addUser = (userId, pushname, _data) => {
    const obj = { userId: userId, pushname: pushname }
    _data.push(obj)
    fs.writeFileSync('./database/user.json', JSON.stringify(_data))
}


/**
 * is user limit? true or false
 * @param {String} userId
 * @param {Object} _data
 * @returns {Boolean}
 */
const isLimit = (userId, _data, isPremium, isOwner) => {
    if (isPremium || isOwner) return false
    let limit = false
    for (let i of _data) {
        if (i.userId === userId) {
            if (i.limit <= 0) {
                limit = true
                return true
            } else {
                limit = true
                return false
            }
        }
    }
    if (limit === false) {
        const obj = { userId: userId, limit: 30}
        _data.push(obj)
        fs.writeFileSync('./database/limit.json', JSON.stringify(_data))
    }
}


/**
 * Add limit to user
 * @param {String} userId
 * @param {Object} _data
 */
const addLimit = (userId, _data) => {
    let pos = null
    Object.keys(_data).forEach((i) => {
        if (_data[i].userId === userId) {
            pos = i
        }
    })
    
    if (pos !== null) {
        _data[pos].limit -= 1
        fs.writeFileSync('./database/limit.json', JSON.stringify(_data))
    }
}



module.exports = {
    isRegistered,
    addUser,
    isLimit,
    addLimit,
    thisPremium,
    addPremium
}