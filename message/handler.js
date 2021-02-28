/** DEPENDENCY */

const { decryptMedia, Client } = require('@open-wa/wa-automate')
const fs = require('fs')
const axios = require('axios')
const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta').locale('id')

/** END */


/** UTILITIES */
const { color } = require('../utils/color')
const tanggal = moment.tz('Asia/Jakarta').format('DD-MM-YYYY')
const { msgFilter } = require('../utils/msgFilter')

const {
    joox,
    soundcloud,
    drakor,
    tiktok,
    igtv,
    youtube
} = require('../lib/downloader')

const {
    jadwalbola,
    lirik,
    chord
} = require('../tools/tools')

const msg = JSON.parse(fs.readFileSync('./message/quickReply.json'))
const { addCommands, checkCommands, deleteCommands } = require('../tools/commands')
const { formatwa } = require('../utils/formatten')
const { isRegistered, addUser, isLimit, addLimit } = require('../lib/database')
const { uploadImages } = require('../utils/fetcher')

const {
    fisheye,
    cartoon,
    comic
} = require('../tools/photo_manipulation')
/** END */


/** DATABASE */

const limit = JSON.parse(fs.readFileSync('./database/limit.json'))
const banned = JSON.parse(fs.readFileSync('./database/banned.json'))
const premium = JSON.parse(fs.readFileSync('./database/premium.json'))
const config = JSON.parse(fs.readFileSync('./auth/config.json'))
const setting = JSON.parse(fs.readFileSync('./auth/setting.json'))
const { groupLimit, minimumMember } = setting
const userData = JSON.parse(fs.readFileSync('./database/user.json'))
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
        const arg = body.substring(body.indexOf(' ') + 1)
        const singleArg = body.slice(1).trim().split(' ')[0]
        const usePrefix = body.substring(1,0)
        const exCmd = usePrefix + singleArg
        
        
        /** VALIDASI USER */
        
        const { unBanned, thisBanned, addBannedList } = require('../lib/banned')
        const isBanned = thisBanned(sender.id, banned)
        const isOwner = sender.id === ownerNumber
        const isGroupAdmins = groupAdmins.includes(sender.id) || false
        const isBotGroupAdmins = groupAdmins.includes(botNumber) || false
        
        const { thisPremium, addPremium } = require('../lib/database')
        const isPremium = thisPremium(sender.id, premium)

        for (var i = 0; i < commandsDB.length ; i++) {
            if (body.toLowerCase() === commandsDB[i].pesan) {
                turu.reply(from, commandsDB[i].balasan, id)
            }
        }
        
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
        
        if (!isRegistered(sender.id, userData)) addUser(sender.id, pushname, userData)

        /** SWITCH - CASE MESSAGE HANDLER */
        switch (command) {
            case 'delete':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (!quotedMsg) return turu.reply(from, `❗️ Silahkan reply pesan Bot dengan caption: ${exCmd}`, id)
                if (!quotedMsgObj.fromMe) return turu.reply(from, 'Maaf gan, Bot tidak dapat menghapus pesan orang lain 🚀', id)
                turu.deleteMessage(quotedMsgObj.chatId, quotedMsgObj.id, false)
                addLimit(sender.id, limit)
                break
            case 'botjoin':
                if (!isPremium) return turu.reply(from, msg.onlyPremium, id)
                if (args.length < 1) return turu.reply(from, `✅ Silahkan kirim ${exCmd} <link grup>`, id)
                try {
                    const inviteInfo = await turu.inviteInfo(body.slice(9))
                    if (isOwner) {
                        await turu.joinGroupViaLink(body.slice(9))
                        await turu.reply(from, `Siap gan, bot akan segera masuk 🚀`, id)
                    } else {
                        const botGroups = await turu.getAllGroups()
                        if (botGroups.length > groupLimit) {
                            await turu.reply(from, `❌ Gagal gan, bot telah mencapai batas maximum grup yang diizinkan :(`, id)
                        } else if (inviteInfo.size <= minimumMember) {
                            await turu.reply(from, `❌ Maaf, jumlah minimum member kurang dari ${minimumMember} orang. Permintaan dibatalkan ❗️`, id)
                        } else if (inviteInfo.size === 257) {
                            await turu.reply(from, '❌ Maaf, anggota grup yang anda minta sudah penuh', id)
                        } else {
                            await turu.joinGroupViaLink(body.slice(9)) 
                                .then(() => turu.reply(from, 'Sukses gan, bot akan segera masuk 🚀', id))
                        }
                    }
                } catch (e) {
                    return turu.reply(from, '❌ Sepertinya link yang kamu berikan tidak valid gan', id)
                }
                break
            case 'ytmp3':
                if (!isPremium) return turu.reply(from, msg.onlyPremium, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${exCmd} https://youtu.be/nApi7BmK5x4`, id)
                await turu.reply(from, msg.proses, id)
                youtube(body.slice(7))
                    .then(async result => {
                        await turu.sendFileFromUrl(from, result.result.thumbnail, 'thumbnail.jpg', `*Judul*: ${result.result.title}\n*Channel*: ${result.result.uploader}\n*Likes*: ${result.result.likeCount}\n*Dislikes*: ${result.result.dislikeCount}\n*Ditonton*: ${result.result.viewCount}x\n*Rating*: ${result.result.rating}\n*Durasi*: ${result.result.duration}\n*Filesize*: ${result.result.audio.size}\n*Deskripsi*:\n${result.result.description}\n\n\n_Mohon menunggu proses pengiriman video 🚀_\n\n\n${msg.footer}`, id)
                        if (result.result.audio.size.split(' MB')[0] > 30) return turu.reply(from, `❗️ Ukura audio terlalu besar, silahkan download manual melalui link dibawah 👇\n\n${result.result.video.url}\n\n\n${msg.footer}`, id)
                        turu.sendFileFromUrl(from, result.result.audio.url, 'youtube.mp3', '', id)
                    })
                    .catch(err => {
                        return turu.reply(from, msg.invalidLink, id)
                    })
                break
            case 'ytmp4':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${exCmd} https://youtu.be/nApi7BmK5x4`, id)
                addLimit(sender.id, limit)
                await turu.reply(from, msg.proses, id)
                youtube(body.slice(7))
                    .then(async result => {
                        await turu.sendFileFromUrl(from, result.result.thumbnail, 'thumbnail.jpg', `*Judul*: ${result.result.title}\n*Channel*: ${result.result.uploader}\n*Likes*: ${result.result.likeCount}\n*Dislikes*: ${result.result.dislikeCount}\n*Ditonton*: ${result.result.viewCount}x\n*Rating*: ${result.result.rating}\n*Durasi*: ${result.result.duration}\n*Filesize*: ${result.result.video.size}\n*Deskripsi*:\n${result.result.description}\n\n\n_Mohon menunggu proses pengiriman video 🚀_\n\n\n${msg.footer}`, id)
                        if (result.result.video.size.split(' MB')[0] > 30) return turu.reply(from, `❗️ Ukuran video terlalu besar, silahkan download manual melalui link dibawah 👇\n\n${result.result.video.url}\n\n\n${msg.footer}`, id)
                        turu.sendFileFromUrl(from, result.result.video.url, 'youtube.mp4', `${msg.videoFinish}\n\n\n${msg.footer}`, id)
                    })
                    .catch(err => {
                        return turu.reply(from, msg.invalidLink, id)
                    })
                break
            case 'chord':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${exCmd} dear god`, id)
                addLimit(sender.id, limit)
                chord(body.slice(7))
                    .then(result => {
                        turu.reply(from, result.result.chord, id)
                    })
                    .catch(err => {
                        return turu.reply(from, '❌ Error gan, chord lagu yang kamu minta tidak ditemukan', id)
                    })
                break
            case 'nulis':
            case 'tulis':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${exCmd} lorem ipsum dolor sit amet`, id)
                await turu.reply(from, msg.proses, id)
                addLimit(sender.id, limit)
                try {
                    turu.sendFileFromUrl(from, `${turu_link}/tools/nulis?apikey=${turukey}&text=${body.slice(7)}`, 'nulis.jpg', msg.picFinish, id)
                } catch (e) {
                    return turu.reply(from, `❌ Error gan, text yang kamu masukan terlalu panjang`, id)
                }
                break
            case 'lirik':
            case 'lyric':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${exCmd} dear god`, id)
                addLimit(sender.id, limit)
                lirik(body.slice(7))
                    .then(result => {
                        turu.reply(from, result.result.lirik, id)
                    })
                    .catch(err => {
                        return turu.reply(from, `❌ Lirik lagu yang anda minta tidak ditemukan.... 🚀`, id)
                    })
                break
            case 'jadwalbola':
            case 'jadwal bola':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                addLimit(sender.id, limit)
                try {
                    await turu.reply(from, msg.proses, id)
                    value = arg.split(' ')
                    jadwalbola('tomorrow')
                        .then(result => {
                            let jadwal = ''
                            for (let i = 0; i < result.result[0].match.length; i++) {
                                var match = result.result[0].match[i]
                                jadwal += `*ID Negara*: ${match.country_id}\n*Nama Negara*: ${match.countryName}\n*Kode Negara*: ${match.countryCode}\n*ID Event*: ${match.event_id}\n*Nama Event*: ${match.eventName}\n*Ronde*: ${match.round}\n*Tanggal & waktu*: ${match.matchDate}, ${match.matchTime}\n*Lokasi*: ${match.venue}\n*Home Team*: ${match.homeTeam}\n*Away Team*: ${match.awayTeam}\n*Channel siaran*: ${match.listChannelName}\n\n`
                            }
                            turu.reply(from, `${jadwal}\n${msg.footer}`, id)
                        })
                        .catch(err => {
                            return turu.reply(from, msg.noData, id)
                        })
                } catch (e) {
                    return
                }
                break
            case 'igtv':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${exCmd} https://www.instagram.com/tv/CINw-5unFnJ/?igshid=1420vl20m4ma8`, id)
                addLimit(sender.id, limit)
                try {
                    await turu.reply(from, msg.proses, id)
                    igtv(body.slice(6))
                        .then(async result => {
                            await turu.sendFileFromUrl(from, result.result.thumbnail[result.result.thumbnail.length - 1].src, 'thumbnail.jpg', `*Judul*: ${result.result.title}\n*Filesize*: ${result.result.size}\n*Durasi*: ${result.result.duration}\n\n*Username*: ${result.result.uploader.username}\n*Nickname*: ${result.result.uploader.fullName}\n*Followers*: ${result.result.uploader.followersCount}\n\n*Dilihat*: ${result.result.viewsCount}x\n*Comments*: ${result.result.commentsCount}\n*Likes*: ${result.result.likesCount}\n*Caption*: ${result.result.caption}\n\n\n_Mohon menunggu proses pengiriman video 🚀_\n\n\n${msg.footer}`, id)
                            if (result.result.size.split(' MB')[0] > 30) return turu.reply(from, `Ukuran video terlalu besar, silahkan download manual melalui link dibawah 😎:\n\n${result.result.video}`, id)
                            turu.sendFileFromUrl(from, result.result.video + '&dl=1', 'igtv.mp4', msg.videoFinish, id)
                        })
                        .catch(err => {
                            return turu.reply(from, `❌ Url tidak valid atau user private`, id)
                        })
                } catch (e) {
                    return turu.reply(from, `❌ Url tidak valid atau user private`, id)
                }
                break
            case 'comic':
            case 'komik':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (isMedia && type === 'image' || isQuotedImage) {
                    addLimit(sender.id, limit)
                    await turu.reply(from, msg.proses, id)
                    const encryptMedia = isQuotedImage ? quotedMsg : message
                    const mediaData = await decryptMedia(encryptMedia, uaOverride)
                    const upload = await uploadImages(mediaData, sender.id)
                    comic(upload)
                        .then(result => {
                            turu.sendFileFromUrl(from, result.result.image, 'comic.jpg', `${msg.picFinish}\n\n\n${msg.footer}`, id)
                        })
                        .catch(err => {
                            return
                        })
                } else {
                    await turu.reply(from, `❌ Tidak ada gambar, silahkan kirim/reply gambar dengan caption ${exCmd}`, id)
                }
                break
            case 'cartoon':
            case 'kartun':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (isMedia && type === 'image' || isQuotedImage) {
                    addLimit(sender.id, limit)
                    await turu.reply(from, msg.proses, id)
                    const encryptMedia = isQuotedImage ? quotedMsg : message
                    const mediaData = await decryptMedia(encryptMedia, uaOverride)
                    const upload = await uploadImages(mediaData, sender.id)
                    cartoon(upload)
                        .then(result => {
                            turu.sendFileFromUrl(from, result.result.image, 'cartoon.jpg', `${msg.picFinish}\n\n\n${msg.footer}`, id)
                        })
                        .catch(err => {
                            return
                        })
                } else {
                    await turu.reply(from, `❌ Gambar tidak ditemukan, silahkan kirim/reply gambar dengan caption: ${exCmd}`, id)
                }
                break
            case 'mataikan':
            case 'fisheye':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (isMedia && type === 'image' || isQuotedImage) {
                    await turu.reply(from, msg.proses, id)
                    addLimit(sender.id, limit)
                    const encryptMedia = isQuotedImage ? quotedMsg : message
                    const mediaData = await decryptMedia(encryptMedia, uaOverride)
                    const upload = await uploadImages(mediaData, sender.id)
                    fisheye(upload)
                        .then(result => {
                            turu.sendFileFromUrl(from, result.result.image, 'fisheye.jpg', `${msg.picFinish}\n\n\n${msg.footer}`, id)
                        })
                        .catch(err => {
                            return
                        })
                } else {
                    await turu.reply(from, `❌ Gambar tidak ditemukan, silahkan kirim/reply gambar dengan caption: ${exCmd}`, id)
                }
                break
            case 'img2url':
            case 'imgtourl':
            case 'image2url':
            case 'imagetourl':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (isMedia && type === 'image' || isQuotedImage) {
                    await turu.reply(from, msg.proses, id)
                    addLimit(sender.id, limit)
                    const encryptMedia = isQuotedImage ? quotedMsg : message
                    const mediaData = await decryptMedia(encryptMedia, uaOverride)
                    const upload = await uploadImages(mediaData, sender.id)
                    if (upload) {
                        await turu.reply(from, upload, id)
                    } else {
                        await turu.reply(from, msg.imageTooBig, id)
                    }
                } else {
                    await turu.reply(from, `❌ Gambar tidak ditemukan, silahkan kirim gambar dengan caption: ${exCmd}`, id)
                }
                break
            case 'unbanned':
                if (!isOwner) return
                if (args.length < 1) return
                if (!thisBanned(formatwa(body.slice(10)), banned)) return turu.reply(from, '❌ User tidak ditemukan', id)
                unBanned(formatwa(body.slice(10)), banned)
                turu.reply(from, 'Sukses gan, user telah di unbanned 🚀', id)
                break
            case 'banned':
                if (!isOwner) return
                if (args.length < 1) return
                value = arg.split(' ')
                if (thisBanned(formatwa(value[0]), banned)) return turu.reply(from, '❌ User telah dibanned sebelumnya', id)
                addBannedList(formatwa(value[0]), value[1].replace(/[ ]/g, ''), banned)
                turu.reply(from, 'Sukses gan, user berhasil dibanned 🚀', id)
                break
            case 'tiktokmp3':
                if (!isPremium) return turu.reply(from, msg.onlyPremium, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${exCmd} https://www.tiktok.com/@fatimahalattas_/video/6851526473417805057?lang=en`, id)
                await turu.reply(from, msg.proses, id)
                tiktok(body.slice(11))
                    .then(result => {
                        turu.sendFileFromUrl(from, result.result.thumbnail, 'thumbnail.jpg', `*Nickname*: ${result.result.nickname}\n*Username*: ${result.result.username}\n*Caption*: ${result.result.caption}\n\n_Mohon menunggu proses pengiriman audio 🚀_\n\n\n${msg.footer}`, id)
                        turu.sendFileFromUrl(from, result.result.audioOnly, '', '', id)
                    })
                    .catch(err => {
                        return turu.reply(from, msg.invalidLink, id)
                    })
                break
            case 'tiktokmp4':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${exCmd} https://www.tiktok.com/@fatimahalattas_/video/6851526473417805057?lang=en`, id)
                addLimit(sender.id, limit)
                await turu.reply(from, msg.proses, id)
                tiktok(body.slice(11))
                    .then(result => {
                        turu.sendFileFromUrl(from, result.result.videoNoWatermark, 'tiktok.mp4', `*Nickname*: ${result.result.nickname}\n*Username*: ${result.result.username}\n*Caption*: ${result.result.caption}\n\n\n${msg.footer}`, id)
                    })
                    .catch(err => {
                        return turu.reply(from, msg.invalidLink, id)
                    })
                break
            case 'drakor':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${exCmd} love`, id)
                addLimit(sender.id, limit)
                await turu.reply(from, msg.proses, id)
                drakor(body.slice(8))
                    .then(result => {
                        let drama = '🚀 ---[ DRAKOR SCRAPER ]--- 🚀\n'
                        for (let i = 0; i < result.result.length; i++) {
                            drama += `\n\n\n*Judul*: ${result.result[i].judul}\n*Kategori*: ${result.result[i].nama_kategori}\n*Tanggal upload*: ${result.result[i].date_time}\n*Stream URL*: ${result.result[i].server2}\n*Deskripsi*: ${result.result[i].deskripsi}`
                        }
                        turu.reply(from, drama, id)
                    })
                    .catch(e => {
                        return turu.reply(from, `❌ Error gan, drama korea yang anda minta tidak ditemukan`, id)
                    })
                break
            case 'meme':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                addLimit(sender.id, limit)
                try {
                    axios.get(`${turu_link}/tools/memeindo?apikey=${turukey}`)
                        .then(result => {
                            turu.sendFileFromUrl(from, result.data.result.meme, 'meme.jpg', '', id)
                        })
                        .catch(e => {
                            return
                        })
                } catch (err){
                    return
                }
                break
            case 'scdlplay':
                if (!isPremium) return turu.reply(from, msg.onlyPremium, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${exCmd} bintang kehidupan`, id)
                await turu.reply(from, msg.proses, id)
                soundcloud(body.slice(10))
                    .then(result => {
                        turu.sendFileFromUrl(from, result.result.thumbnail, 'thumbnail.jpg', `*Judul*: ${result.result.title}\n*Genre*: ${result.result.genre}\n*Tanggal rilis*: ${result.result.published_at}\n*Durasi*: ${result.result.duration}\n*Filesize*: ${result.result.filesize}\n\n_Mohon menunggu proses pengiriman music 🚀_\n\n\n${msg.footer}`, id)
                        turu.sendFileFromUrl(from, result.result.music, '', '', id)
                    })
                    .catch(err => {
                        return turu.reply(from, msg.musicNotFound, id)
                    })
                break
            case 'stickerwm':
            case 'stikerwm':
            case 'stikwm':
            case 'stickwm':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (args.length < 2) return turu.reply(from, `✅Contoh: kirim gambar dengan caption ${usePrefix}${singleArg} author | pack`,  id)
                if (!args.includes('|')) return turu.reply(from, `Contoh: kirim gambar dengan caption ${usePrefix}${singleArg} author | pack`, id)
                addLimit(sender.id, limit)
                if (isMedia && type === 'image' || isQuotedImage) {
                    try {
                        value = arg.split(' | ')
                        const encryptMedia = isQuotedImage ? quotedMsg : message
                        const mediaData = await decryptMedia(encryptMedia, uaOverride)
                        turu.sendImageAsSticker(from, `data:${quotedMsg.mimetype || mimetype};base64,${mediaData.toString('base64')}`, {author: value[0], pack: value[1], keepScale: 'true'})
                    } catch (e) {
                        return turu.reply(from, msg.imageTooBig, id)
                    }
                } else {
                    await turu.reply(from, `❌ Tidak ada gambar, silahkan kirim/reply gambar dengan caption: ${usePrefix}${singleArg}`, id)
                }
                break
            case 'addpremium':
                if (!isOwner) return
                if (args.length < 2) return
                value = arg.split(' | ')
                addPremium(formatwa(value[0]), value[1], premium)
                turu.reply(from, 'Sukses gan, user telah ditambahkan sebagai Member Premium 🚀', id)
                break
            case 'exec':
                if (!isOwner) return
                if (body.slice(6).length < 1) return
                try {
                    let evaled = await eval(body.slice(6))
                    if (typeof evaled !== 'string') evaled = required('util').inspect(evaled)
                    turu.reply(from, evaled, id)
                } catch (e) {
                    return turu.reply(from, e, id)
                }
                break
            case 'pdel':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (args.length < 1) return turu.reply(from, `📑 Petunjuk: silahkan kirim ${exCmd} <command>`, id)
                if (!checkCommands(body.slice(6), commandsDB)) return turu.reply(from, `❌ Command yang anda masukan tidak ditemukan`, id)
                deleteCommands(body.slice(6), commandsDB)
                turu.reply(from, 'Sukses gan, command telah dihapus dari database 🚀', id)
                break
            case 'addcommands':
            case 'addcommand':
            case 'padd':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (args.length < 3) return turu.reply(from, `✅ Contoh: ${usePrefix}${singleArg} bot | hai kak`, id)
                if (!args.includes('|')) return turu.reply(from, `✅ Contoh: ${usePrefix}${singleArg} bot | hai kak`, id)
                value = arg.split(' | ')
                addLimit(sender.id, limit)
                if (checkCommands(value[0], commandsDB) === true) return turu.reply(from, `❌ Gagal gan, command yang kamu masukan telah terdaftar dalam database. Silahkan delete command dengan cara ketik: ${usePrefix}pdel ${value[0]}`, id)
                addCommands(value[0], value[1], sender.id, commandsDB)
                turu.reply(from, 'Sukses gan, custom autoresponder telah ditambahkan ke database 🚀', id)
                break
            case 'tahta':
            case 'harta':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (!isPremium) return turu.reply(from, msg.onlyPremium, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${usePrefix}${singleArg} wanita`, id)
                await turu.reply(from, msg.proses, id)
                addLimit(sender.id, limit)
                turu.sendFileFromUrl(from, `${turu_link}/textmaker/harta_tahta?apikey=${turukey}&text=${encodeURIComponent(body.slice(7))}`, 'hartatahta.jpg', msg.picFinish, id)
                break
            case 'stickergif':
            case 'stikergif':
            case 'sgif':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                addLimit(sender.id, limit)
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
            case 'simi':
                if (!isPremium) return turu.reply(from, msg.onlyPremium, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${usePrefix}${singleArg} apa kabar simi?`, id)
                axios.get(`${turu_link}/tools/simsimi?apikey=${turukey}&pesan=${body.slice(6)}`).then(result => {
                    turu.reply(from, result.data.result.response, id)
                }).catch(e => {
                    return turu.reply(from, 'Maaf kak, simi ga paham yang kamu maksud 🤔', id)
                })
                break
            case 'stiker':
            case 'sticker':
            case 'setiker':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                addLimit(sender.id, limit)
                try {
                    if (isMedia && type === 'image') {
                        const mediaData = await decryptMedia(message, uaOverride)
                        turu.sendImageAsSticker(from, `data:${mimetype};base64,${mediaData.toString('base64')}`, {author: 'Turu Bot', pack: 'Sticker', keepScale: 'true'})
                    } else if (quotedMsg && quotedMsg.type === 'image') {
                        const mediaData = await decryptMedia(quotedMsg, uaOverride)
                        turu.sendImageAsSticker(from, `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`, {author: 'Turu Bot', pack: 'Sticker', keepScale: 'true'})
                    } else {
                        await turu.reply(from, `Tidak ada gambarnya sob, silahkan kirim/reply gambar dengan caption ${usePrefix}${singleArg}`, id)
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
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                addLimit(sender.id, limit)
                if (isQuotedSticker) {
                    try {
                        const mediaData = await decryptMedia(quotedMsg, uaOverride)
                        turu.sendFile(from, `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`, 'decrypt.png', msg.picFinish, id)
                    } catch (e) {
                        return turu.reply(from, msg.stickerTooBig, id)
                    }
                } else {
                    await turu.reply(from, `❌ Tidak ada sticker. Silahkan reply sticker dengan caption ${usePrefix}${singleArg}`, id)
                }
                break
            case 'joox':
                if (isLimit(sender.id, limit, isPremium, isOwner)) return turu.reply(from, msg.limitReached, id)
                if (args.length < 1) return turu.reply(from, `✅ Contoh: ${usePrefix}${singleArg} dear god`, id)
                await turu.reply(from, msg.proses, id)
                addLimit(sender.id, limit)
                joox(body.slice(6))
                    .then(result => {
                        turu.sendFileFromUrl(from, result.result.thumbnail, 'thumbnail.jpg', `*Judul*: ${result.result.title}\n*Penyanyi*: ${result.result.singer}\n*Album*: ${result.result.album}\n*Tgl rilis*: ${result.result.realease_date}\n*Durasi*: ${result.result.duration}\n*Size*: ${result.result.size}\n*Lirik*: \n${result.result.lyric}\n\n_Mohon menunggu proses pengiriman audio 🚀_\n\n\n${msg.footer}`, id)
                        turu.sendFileFromUrl(from, result.result.mp3, '', '', id)
                    }).catch(err => {
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