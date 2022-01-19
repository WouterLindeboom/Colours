const { SlashCommandBuilder } = require('@discordjs/builders');
const { mysql } = require('../config.json');
const sql = require('mysql');
const connection = sql.createPool({host:mysql.host, user:mysql.user, password:mysql.password, database:mysql.database, connectionLimit:10});

var timeout = [];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('colour')
		.setDescription('Sets your colour')
		.addStringOption(option =>
            option.setName('hex')
                .setDescription('A valix hex code')
                .setRequired(true)),

	async execute(interaction, client) {
        setColour(interaction, client);
	},
};



function setColour(interaction, client){
    let uid = interaction.user.id
    if(timeout.indexOf(uid)>-1){
        interaction.reply(`You are being ratelimited`)
        return
    }
    const validHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    var guildfetch;
    client.guilds.fetch('121335756156436480')
        .then(result => guildfetch = result)
    // if(params.length != 1){
    //     interaction.reply('Usage: `!colour <hex>`')
    //     return
    // }
    let hex = interaction.options._hoistedOptions[0].value;
    if(hex[0] !== '#') hex = '#'+hex
    if(!validHex.test(hex) && hex !== "#random"){
        interaction.reply({content:'Invalid hex',ephemeral:true})
        return
    }
    if(hex == "#random"){
        hex = "#"+Math.floor(Math.random()*16777215).toString(16);
    }

    connection.query(`SELECT * FROM colourrole WHERE uid = ${uid}`, function (error, results, fields) {
        guild = guildfetch;
        if (error) throw error;
        if(results.length == 0){//If no set colour, create role and add to DB

            guild.roles.create({
                name: hex.replace('#',''),
                color: hex
            })
            .then(role => connection.query(`INSERT INTO colourrole VALUES(${uid}, ${role.id})`, function (error, results, fields) {
                if (error) throw error;
                guild.members.fetch(uid)
                    .then(member => {
                        member.roles.add(role.id)
                    })
                
            }))

        }else {//User already has role, update with new colour and name
            guild.roles.fetch(`${results[0].rid}`)
                .then(userRole => {
                    userRole.edit({
                        name: hex.replace('#',''),
                        color: hex
                    })
                    guild.members.fetch(uid)
                        .then(member => {
                            member.roles.add(results[0].rid)
                            interaction.reply({content:`Colour set to <@&${results[0].rid}>!`,ephemeral:true})
                            timeout.push(uid)
                            setTimeout(function(){
                                let index = timeout.indexOf(uid)
                                timeout.splice(index, 1)
                              }, 60000);
                        })
                })
        }
    });


}