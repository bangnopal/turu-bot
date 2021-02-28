/** DEPENDENCY */

const { create, Client } = require('@open-wa/wa-automate')
const { color } = require('./utils/color')
const { options } = require('./lib/options')
const msgHandler = require('./message/handler')
const figlet = require('figlet')
const fs = require('fs-extra')
const canvas = require('discord-canvas')

/** END */


/** DATABASE */

const config = JSON.parse(fs.readFileSync(('./auth/config.json')))
const setting = JSON.parse(fs.readFileSync(('./auth/setting.json')))

const { turu_link, turukey } = config

/** END */


const start = (turu =  new Client()) => {
    console.log(color(figlet.textSync('Turu Bot', 'Larry 3D'), 'cyan'))
    console.log(color('[NOTICE]', 'green'), color('Turu bot started', 'yellow'))
    
    turu.onStateChanged((state) => {
        console.log(color('[TURU]', 'yellow'), state)
        if (state === 'UNPAIRED' || state === 'UNLAUNCHED' || state === 'CONFLICT') turu.forceRefocus()
    })
    
    turu.onAddedToGroup(async (chat) => {
        console.log(color('[TURU]', 'green'), color(`Telah ditambahkan ke dalam grup ${chat.contact.name}`, 'yellow'))
        
        const group = await turu.getAllGroups()
        if (chat.groupMetadata.participants.includes(config.ownerNumber)) {
            await turu.sendText(chat.id, `Hai semuanya 👋, namaku ${config.botName}.\nTerimakasih telah mengundang ${config.botName}, saya akan membantu kalian selama disini 😎.`)
        } else if (group.length > setting.groupLimit) {
            await turu.sendText(chat.id, `Maaf kak, saat ini ${config.botName} telah mencapai batas group. Total group ${group.length}.\nBot akan keluar otomatis dalam beberapa detik, sampai jumpa 👋`)
            await turu.deleteChat(chat.id)
            await turu.leaveGroup(chat.id)
        } else if (chat.groupMetadata.participants.length < setting.minimumMember) {
            await turu.sendText(chat.id, `Maaf kak, minimum member untuk mengundang ${config.botName} adalah ${setting.minimumMember} orang.\n${config.botName} akan keluar otomatis dalam beberapa detik, sampai jumpa 👋`)
            await turu.deleteChat(chat.id)
            await turu.leaveGroup(chat.id)
        } else {
            await turu.sendText(chat.id, `Hai semuanya 👋, namaku ${config.botName}.\nTerimakasih telah mengundang ${config.botName}, saya akan membantu kalian selama disini 😎.`)
        }
    })
    
    turu.onMessage((message) => {
        turu.getAmountOfLoadedMessages()
            .then((cache) => {
                if (cache >= setting.maxMsgCache) {
                    console.log(color('[CLEANING]', 'green'), color('Cache message mencapai batas, beberapa pesan akan dihapus oleh sistem', 'yellow'))
                    turu.cutMsgCache()
                    console.log(color('[CLEAR]', 'cyan'), color('Message cache telah dihapus', 'yellow'))
                }
            })
        
        msgHandler(turu, message)
    })
    
    turu.onIncomingCall(async (call) => {
        await turu.sendText(call.peerJid, `Maaf kak, kamu melanggar ketentuan penggunaan Bot untuk tidak menelepon Bot.\nKamu akan di blokir otomatis oleh sistem, selamat tinggal 👋`)
        await turu.contactBlock(call.peerJid)
        console.log(color('[BLOCK]', 'red'), color(`${call.peerJid.replace('@c.us', '')} telah di blokir. Reason: menelepon Bot`, 'yellow'))
    })
    
    turu.onGlobalParticipantsChanged(async (event) => {
        //const welcome = JSON.parse(fs.readFileSync('./database/welcome.json'))
        //const isWelcomeOn = welcome.includes(event.chat)
        const groupInfo = await turu.getChatById(event.chat)
        const dmInfo = await turu.getContact(event.who)
        let { pushname, formattedName, verifiedName } = dmInfo
        pushname = pushname || formattedName || verifiedName
        const { name, groupMetadata } = groupInfo
        const botNumber = await turu.getHostNumber() + '@c.us'
        
        try {
            if (event.action === 'add' && event.who !== botNumber) {
                const profilePic = await turu.getProfilePicFromServer(event.who)
                if (profilePic === undefined) {
                    var pic = `${turu_link}/media/example.png`
                } else {
                    pic = profilePic
                }
                
                const welcomer = await new canvas.Welcome()
                    .setUsername(pushname)
                    .setDiscriminator(event.who.substring(4,8))
                    .setMemberCount(groupMetadata.participants.length)
                    .setGuildName(name)
                    .setAvatar(pic)
                    .setColor('border', '#00100C')
                    .setColor('username', '#00FFFF')
                    .setColor('discriminator-box', '#00100C')
                    .setColor('message', '#FF0000')
                    .setColor('title', '#00FF00')
                    .setBackground('https://storage.naufalhoster.xyz/uploads/brown-vintage-paper-background-texture_7327776694357242457598569.jpg')
                    .toAttachment()
                await turu.sendFile(event.chat, `data:image/png;base64,${welcomer.toBuffer().toString('base64')}`, 'welcome.png', `Hai *${pushname}* 👋, selamat datang di *${name}*. Semoga betah yaa ❤`)
            } else if (event.action === 'remove' && event.who !== botNumber) {
                const profilePic = await turu.getProfilePicFromServer(event.who)
                if (profilePic === undefined) {
                    var pic = `${turu_link}/media/example.png`
                } else {
                    pic = profilePic
                }
                const goodbye = await new canvas.Goodbye()
                    .setUsername(pushname)
                    .setDiscriminator(event.who.substring(4,8))
                    .setMemberCount(groupMetadata.participants.length)
                    .setGuildName(name)
                    .setAvatar(pic)
                    .setColor('border', '#00100C')
                    .setColor('username', '#00FFFF')
                    .setColor('discriminator-box', '#00100C')
                    .setColor('message', '#FF0000')
                    .setColor('title', '#00FF00')
                    .setBackground('https://storage.naufalhoster.xyz/uploads/brown-vintage-paper-background-texture_7327776694357242457598569.jpg')
                    .toAttachment()
                await turu.sendFile(event.chat, `data:image/png;base64,${goodbye.toBuffer().toString('base64')}`, 'goodbye.png', `Selamat tinggal *${pushname}* 🙋, semoga hari-harimu menyenangkan ❤`)
            }
        } catch (err) {
            return console.error(err)
        }
    })
}


create(options(start))
    .then((turu) => start(turu))
    .catch((err) => console.error(err))