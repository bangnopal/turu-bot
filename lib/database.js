const fs = require('fs-extra')

const setting = JSON.parse(fs.readFileSync('./auth/setting.json'))

/**
 * Check if user is registered or not
 * @param {String} userId
 * @param {Object} _data
 * @returns {Boolean}
 */
const isRegistered = (userId, _data) => {
    for (let i of _data) {
        if (i.userId === userId) {
            return true
        } else {
            return false
        }
    }
}


/**
 * Adding user to database
 * @param {String} userId
 * @param {String} pushname
 * @param {Object} _data
 */
const addUser = (userId, pushname, _data) => {
    const obj = {
        userId: userId,
        pushname: pushname,
        limit: setting.userFreeLimit,
        hitCount: 0
    }
    _data.push(obj)
    fs.writeFileSync('./database/user.json', JSON.stringify(obj))
}


/**
 * is user limit? true or false
 * @param {String} userId
 * @param {Object} _data
 * @returns {Boolean}
 */
const isLimit = (userId, _data) => {
    for (let i of _data) {
        if (i.limit <= 0) {
            return true
        } else {
            return false
        }
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
        fs.writeFileSync('./database/user.json', JSON.stringify(_data))
    }
}



module.exports = {
    isRegistered,
    addUser,
    isLimit,
    addLimit
}