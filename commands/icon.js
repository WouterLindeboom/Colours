const { SlashCommandBuilder } = require('@discordjs/builders');
const { mysql } = require('../config.json');
const sql = require('mysql');
const connection = sql.createPool({host:mysql.host, user:mysql.user, password:mysql.password, database:mysql.database, connectionLimit:10});
const emojiregex = /<a:.+?:\d+>|<:.+?:\d+>|[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu
var timeout = [];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('icon')
		.setDescription('Sets your role icon')
		.addStringOption(option =>
            option.setName('emoji')
                .setDescription('An emoji')
                .setRequired(true)),

	async execute(interaction, client) {
        setIcon(interaction, client);
	},
};

function setIcon(i, c){
    let uid = i.user.id
    if(timeout.indexOf(uid)>-1){
        i.reply(`You are being ratelimited`)
        return
    }

    connection.query(`SELECT * FROM colourrole WHERE uid = ${uid}`, function (error, results, fields) {
        if (error) throw error;
        if(results.length == 0){
            i.reply({content:`You need a coloured role for role icons to work!\nPlease use \`/colour\` to give yourself a coloured role first.`, ephemeral:true});
            return
        };
        let emoji = i.options._hoistedOptions[0].value.match(emojiregex);
        if(emoji === null){
            i.reply({content:`That doesn't look like a valid emoji to me.`, ephemeral:true});
            return
        }
        let getRole = i.member.guild.roles.fetch(results[0].rid)
            .then(role => {
                emoji = emoji[0];
                if(emoji.startsWith('<')){
                    let emojiid = emoji.split(':')[2].slice(0, -1)
                    emojiurl = `https://cdn.discordapp.com/emojis/${emojiid}.png`;
                    role.setIcon(emojiurl)
                        .then(() => {
                            i.reply({content:`Role icon set to ${emoji}!`, ephemeral:true})
                            timeout.push(uid)
                            setTimeout(function(){
                                let index = timeout.indexOf(uid)
                                timeout.splice(index, 1)
                              }, 60000);
                        })
                } else {
                    role.setIcon(null)
                        .then(() => {
                            role.setUnicodeEmoji(emoji.toString())
                                .then(result => {
                                    i.reply({content:`Role icon set to ${emoji}!`, ephemeral:true})
                                    timeout.push(uid)
                                    setTimeout(function(){
                                        let index = timeout.indexOf(uid)
                                        timeout.splice(index, 1)
                                    }, 60000);
                                })
                        })
                    
                }
                
            })
    })
}