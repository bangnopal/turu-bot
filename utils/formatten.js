/**
 * Formatting unexpected number to international phone number
 * @param {Integer} number
 * @returns {Integer}
 */
const formatwa = (number) => {
    if (number.substring(2, 0) == "08") {
        var number = number.replace(number.substring(2, 0), "628").replace(/[-+ ()@c.us]/g, "")
    } else if (number.substring(1, 0) == "8") {
        var number = number.replace(number.substring(1, 0), "628").replace(/[-+ ()@c.us]/g, "")
    } else {
        var number = number.replace(/[-+ ()@c.us]/g, "")
    }

    return number + "@c.us"
}


module.exports = {
    formatwa
}