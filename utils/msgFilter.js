const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta').locale('id')

// Anti-spam
const usedCommandRecently = new Set()

/**
 * Check is number filtered.
 * @param {string} from 
 * @returns {boolean}
 */
const isFiltered = (from) => {
    return !!usedCommandRecently.has(from)
}

/**
 * Add filter to number.
 * @param {string} from 
 */
const addFilter = (from) => {
    usedCommandRecently.add(from)
    setTimeout(() => {
        return usedCommandRecently.delete(from)
    }, 5000) // 5 seconds delay.
}


module.exports = {
    msgFilter: {
        isFiltered,
        addFilter
    }
}