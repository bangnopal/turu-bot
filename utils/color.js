/** DEPENDENCY */

const chalk = require('chalk')

/** END **/


/** Return text with color (work if show as console.log)
 * @param {string} color
 * @param {string} text
 */
const color = (text, color) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text)
}



module.exports = {
    color
}