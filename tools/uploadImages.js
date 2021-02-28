const imgbb = require('imgbb-uploader')
const imgbb_key = '04b9e9337ecb1ceb0250f81549301785' // put your own imgbb apikey here. (get it from api.imgbb.com)


/**
 * Upload image from base64 string to imgbb.com (free imahe hosting)
 * @param {String} images
 * @returns {Array}
 */
const uploadImages = async (images) => new Promise ((resolve, reject) => {
    if (!images) throw new Error('empty image to upload')
    const options = {
        apiKey: imgbb_key,
        base64string: images
    }
    
    imgbb(options)
        .then((result) => resolve(result))
        .catch((err) => reject(err))
})



module.exports = {
    uploadImages
}