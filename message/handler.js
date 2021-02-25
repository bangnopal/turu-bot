/** DEPENDENCY */

const { decryptMedia, Client } = require('@open-wa/wa-automate')
const fs = require('fs')
const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta').locale('id')

/** END */


/** UTILITIES */

const { color } = require('../utils/color')
const tanggal = moment.tz('Asia/Jakarta').format('DD-MM-YYYY')
const { msgFilter } = require('../utils/msgFilter')
const { joox } = require('../lib/downloader')
const msg = JSON.parse(fs.readFileSync('./message/quickReply.json'))
const { addCommands, checkCommands } = require('../tools/commands')
const { isRegistered, addUser, isLimit, addLimit } = require('../lib/database')

/** END */


/** DATABASE */

const banned = JSON.parse(fs.readFileSync('./database/banned.json'))
const premium = JSON.parse(fs.readFileSync('./database/premium.json'))
const config = JSON.parse(fs.readFileSync('./auth/config.json'))
const setting = JSON.parse(fs.readFileSync('./auth/setting.json'))
const commandsDB = JSON.parse(fs.readFileSync('./database/commands.json'))

/** END */


/** MESSAGE HANLDER */

module.exports = msgHandler = async (turu = new Client(), message) => {
    try {
        const { type, id, from, t, sender, isGroupMsg, chat, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
        let { body } = message
        const { name, formattedTitle } = chat
        let { pushname, verifiedName, formattedName } = sender
        pushname = pushname || verifiedName || formattedName
        const { botName, ownerNumber, turukey, uaOverride, turu_link} = config
        const botNumber = await turu.getHostNumber() + '@c.us'
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = isGroupMsg ? await turu.getGroupAdmins(groupId) : ''
        const time = moment(t * 1000).format('DD/MM/YY HH:mm:ss')
        
        const chats = (type === 'chat') ? body : ((type === 'image' || type === 'video')) ? caption : ''
        body = (type === 'chat') ? body : ((type === 'image' || type === 'video') && caption) ? caption : ''
        const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
        const args = body.slice(1).trim().split(/ +/).slice(1)
        const singleArg = body.slice(1).trim().split('')[0]
        const arg = body.substring(body.indexOf(' ') + 1)
        const q = args.join(' ')
        const usePrefix = body.substring(1,0)
        
        
        /** VALIDASI USER */
        
        const isBanned = banned.includes(sender.id)
        const isOwner = sender.id === ownerNumber
        const isGroupAdmins = groupAdmins.includes(sender.id) || false
        const isBotGroupAdmins = groupAdmins.includes(botNumber) || false
        
        for (var i = 0; i < premium.length; i++) {
            const isPremium = premium[i].nomor.includes(sender.id)
        }
        
        for (var i = 0; i < commandsDB.length ; i++) {
            if (body.toLowerCase() === commandsDB[i].pesan) {
                turu.reply(from, commandsDB[i].balasan, id)
            }
        }
        
        if (!isRegistered(sender.id)) return turu.reply(from, 'youre not registered', id)
        
        const isQuotedImage = quotedMsg && quotedMsg.type === 'image'
        const isQuotedVideo = quotedMsg && quotedMsg.type === 'video'
        const isQuotedSticker = quotedMsg && quotedMsg.type === 'sticker'
        const isQuotedGif = quotedMsg && quotedMsg.mimetype === 'image/gif'
        const isImage = type === 'image'
        const isVideo = type === 'video'
        
        /** END */
        
        if (isBanned) return console.log(color('[BANNED]', 'red'), color('user terbanned berusaha menggunakan Bot', 'yellow'))
        
        /** ANTI SPAM */
        if (msgFilter.isFiltered(from) && !isGroupMsg) return console.log(color('[SPAM]', 'red'), color(time, 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname))
        if (msgFilter.isFiltered(from) && isGroupMsg) return console.log(color('[SPAM]', 'red'), color(time, 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle))
        if (!isOwner) msgFilter.addFilter(from)
        /** ANTI SPAM END */

        /** LOG */
        if (isGroupMsg) console.log(color('[MESSAGE]', 'green'), `${color(`${body} [${args.length}]`, 'gold')}`, 'from', color(pushname, 'yellow'), 'in', color((name || formattedTitle)), 'green')
        if (!isGroupMsg) console.log(color('[MESSAGE]', 'green'), `${color(`${body} [${args.length}]`, 'gold')}`, 'from', color(pushname, 'yellow'))
        /** END */
        
        
        /** SWITCH - CASE MESSAGE HANDLER */
        switch (command) {
            case 'addcommands':
            case 'addcommand':
            case 'padd':
                if (args.length < 3) return turu.reply(from, `✅ Contoh: ${usePrefix}${singleArg} bot | hai kak`, id)
                if (!args.includes('|')) return turu.reply(from, `✅ Contoh: ${usePrefix}${singleArg} bot | hai kak`, id)
                value = arg.split(' | ')
                if (checkCommands(value[0], commandsDB) === true) return turu.reply(from, `❌ Gagal gan, command yang kamu masukan telah terdaftar dalam database. Silahkan delete command dengan cara ketik: ${usePrefix}pdel ${value[0]}`, id)
                addCommands(value[0], value[1], sender.id, commandsDB).then(() => {
                    turu.reply(from, 'Sukses gan, command berhasil ditambahkan', id)
                })
                break
            case 'tahta':
            case 'harta':
                if (!isPremium) return turu.reply(from, msg.onlyPremium, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${usePrefix}${body} wanita`)
                await turu.reply(from, msg.proses, id)
                turu.sendFileFromUrl(from, `${turu_link}/textmaker/harta_tahta?apikey=${turukey}&text=${encodeURIComponent(body.slice(7))}`, 'hartatahta.jpg', msg.picFinish, id)
                break
            case 'stickergif':
            case 'stikergif':
            case 'sgif':
                if (isMedia && type === 'video' || mimetype === 'image/gif' || isQuotedVideo || isQuotedGif) {
                    try {
                        const encryptMedia = isQuotedVideo ? quotedMsg : message || isQuotedGif
                        const mediaData = await decryptMedia(encryptMedia, uaOverride)
                        turu.sendMp4AsSticker(from, `data:${mimetype};base64,${mediaData.toString('base64')}`, null, {
                            stickerMetadata: true,
                            pack: 'Turu Bot',
                            author: 'Turu API',
                            fps: 30,
                            startTime: `00:00:00.0`,
                            endTime: `00:00:05.0`,
                            crop: false,
                            loop: 0
                        })
                    } catch (e) {
                        return turu.reply(from, msg.videoTooBig, id)
                    }
                } else {
                    await turu.reply(from, `Gambarnya mana?? bjirr 🚀`, id)
                }
                break
            case 'stiker':
            case 's':
            case 'sticker':
            case 'setiker':
                try {
                    if (isMedia && type === 'image') {
                        const mediaData = await decryptMedia(message, uaOverride)
                        turu.sendImageAsSticker(from, `data:${mimetype};base64,${mediaData.toString('base64')}`, {author: 'Turu Bot', pack: 'Sticker', keepScale: 'true'})
                    } else if (quotedMsg && quotedMsg.type === 'image') {
                        const mediaData = await decryptMedia(quotedMsg, uaOverride)
                        turu.sendImageAsSticker(from, `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`, {author: 'Turu Bot', pack: 'Sticker', keepScale: 'true'})
                    } else {
                        await turu.reply(from, `Tidak ada gambarnya sob, silahkan kirim/reply gambar dengan caption ${usePrefix}${body}`, id)
                    }
                } catch (e) {
                    return turu.reply(from, msg.imageTooBig, id)
                }
                break
            case 'toimg':
            case 'stikertoimg':
            case 'toimage':
            case 'stickertoimg':
            case 'decrypt':
                if (isQuotedSticker) {
                    try {
                        const mediaData = await decryptMedia(quotedMsg, uaOverride)
                        turu.sendFile(from, `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`, 'decrypt.jpg', msg.picFinish, id)
                    } catch (e) {
                        return turu.reply(from, msg.stickerTooBig, id)
                    }
                } else {
                    await turu.reply(from, `❌ Tidak ada sticker. Silahkan reply sticker dengan caption ${usePrefix}${body}`, id)
                }
                break
            case 'joox':
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${usePrefix}joox dear god`, id)
                await turu.reply(from, msg.proses, id)
                joox(body.slice(6))
                    .then(result => {
                        turu.sendFileFromUrl(from, result.result.thumbnail, 'thumbnail.jpg', `*Judul*: ${result.result.title}\n*Penyanyi*: ${result.result.singer}\n*Album*: ${result.result.album}\n*Tgl rilis*: ${result.result.realease_date}\n*Durasi*: ${result.result.duration}\n*Size*: ${result.result.size}\n*Lirik*: \n${result.result.lyric.replace('', 'Tidak ada lirik')}\n\n\n_Mohon menunggu proses pengiriman audio 🚀_`, id)
                        turu.sendFileFromUrl(from, result.result.mp3, '', '', id)
                    }).catch(err => {
                        console.log(err)
                        return turu.reply(from, msg.musicNotFound, id)
                    })
                break
            default:
                return
        }
    } catch (err) {
        return console.error(err)
    }
}