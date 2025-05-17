const {Client, Collection, Partials, GatewayIntentBits, EmbedBuilder} = require("discord.js");
const moment = require("moment");
const fs = require("fs")
const {Token} = require("./config")
const set = require("./ayarlar/setting")
const emoji = require("./ayarlar/emojis.json")
const { readdirSync} = require("fs")
const eventFiles = readdirSync('./Ready').filter(file => file.endsWith('.js'));
const IncludedIntents = Object.entries(GatewayIntentBits).reduce((t, [, V]) => t | V, 0);
const client = new Client({ intents: IncludedIntents});
  moment.locale("tr");
  require('moment-duration-format');
  require('./utils/eventloader')(client);

  

  for (let file of eventFiles) {
	let event = require(`./Ready/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}


  client.login(Token).catch( err=>{console.log(`Tokene bağlanılamadı! Tokeni kontrol edin.`)}).then(console.log("Tokene başarılı bir şekilde bağlanıldı!") )

  process.on("unhandledRejection", (err) => {
	console.log(err);  
	  });
  process.on("uncaughtException", (err) => {
  console.log(err)
  }
   );






  // Komut İşleme  //

  client.commands = new Collection();
  client.aliases = new Collection();
  fs.readdir("./command/", (err, files) => {
	if (err) console.error(err);
	
	files.forEach(f => {
	  let props = require(`./command/${f}`);
	  ;
	  client.commands.set(props.help.name, props);
	  props.conf.aliases.forEach(alias => {
		client.aliases.set(alias, props.help.name);
	  });
	});
  });
  client.reload = command => {
	return new Promise((resolve, reject) => {
	  try {
		delete require.cache[require.resolve(`./command/${command}`)];
		let cmd = require(`./command/${command}`);
		client.commands.delete(command);
		client.aliases.forEach((cmd, alias) => {
		  if (cmd === command) client.aliases.delete(alias);
		});
		client.commands.set(command, cmd);
		cmd.conf.aliases.forEach(alias => {
		  client.aliases.set(alias, cmd.help.name);
		});
		resolve();
	  } catch (e) {
		reject(e);
	  }
	});
  };
  client.load = command => {
	return new Promise((resolve, reject) => {
	  try {
		let cmd = require(`./command/${command}`);
		client.commands.set(command, cmd);
		cmd.conf.aliases.forEach(alias => {
		  client.aliases.set(alias, cmd.help.name);
		});
		resolve();
	  } catch (e) {
		reject(e);
	  }
	});
  };
  client.unload = command => {
	return new Promise((resolve, reject) => {
	  try {
		delete require.cache[require.resolve(`./command/${command}`)];
		let cmd = require(`./command/${command}`);
		client.commands.delete(command);
		client.aliases.forEach((cmd, alias) => {
		  if (cmd === command) client.aliases.delete(alias);
		});
		resolve();
	  } catch (e) {
		reject(e);
	  }
	});
  };


  
// Kayıt Mesaj


client.on("guildMemberAdd", async (member) => {
    let guild = member.guild;
    let user = member.user;
    let totalMembers = guild.memberCount;
    let accountAge = Date.now() - user.createdTimestamp;
    let accountMonth = moment.duration(accountAge).format("M");
    let isSafe = accountMonth >= 1;
    let securityStatus = isSafe 
        ? `${emoji.onay} **\`Güvenilir\`**` 
        : `${emoji.red} **\`Şüpheli\`**`;

    
    let welcomeEmbed = new EmbedBuilder()
        .setColor(isSafe ? "#00ff00" : "#ff0000")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setAuthor({ name: `${guild.name} | Hoş Geldin`, iconURL: guild.iconURL({ dynamic: true }) })
        .setDescription(`
        ${emoji.hg1} **Hoş geldin ${member}!** 🎉  
        ${emoji.hg2} **Seninle birlikte** \`${totalMembers}\` **kişiyiz!**  
        
        🔹 **Hesap oluşturma tarihi:** <t:${Math.floor(user.createdTimestamp / 1000)}>  
        🔹 **Bu hesap:** ${securityStatus}  
        
        ${emoji.hg3} **Kayıt olmak için** <@&${set.registerYetkili}> **yetkililerini bekleyebilirsin.**  
        🎙️ **Sesli teyit için uygun bir kanala girerek yetkililere haber verebilirsin.**  
        📌 **İsmini ve yaşını söyleyerek de kayıt olabilirsin.**  
        
        ${emoji.hg6} **📜 Kuralları okumayı unutma! Sunucuya girerek tüm kuralları kabul etmiş sayılırsın.** 🛑
        `)
        .setFooter({ text: `İyi sohbetler dileriz!`, iconURL: guild.iconURL({ dynamic: true }) });

 
    let registerChannel = client.channels.cache.get(set.registerChat);
    if (registerChannel) registerChannel.send({ embeds: [welcomeEmbed], content:`<@&${set.registerYetkili}>` });

 
    member.roles.add(set.kayıtsızRol);
    member.setNickname(set.kayıtsızİsim);
});


// Kayıt Mesaj Son


//Tagrol

client.on("userUpdate", async (oldUser, newUser) => {
    const guildID = set.sunucuID; // Sunucu ID
    const roleID = set.tagRol; // Taglı rolü
    const tag = set.tag; // Tag sembolü
    const chatID = set.genelChat; // Genel sohbet kanalı
    const logID = set.tagLog; // Tag log kanalı

   
    const guild = client.guilds.cache.get(guildID);
    if (!guild) return;

    const role = guild.roles.cache.get(roleID);
    if (!role) return;

    const member = guild.members.cache.get(newUser.id);
    if (!member || member.user.bot) return;

   
    const hadTag = oldUser.username.includes(tag);
    const hasTagNow = newUser.username.includes(tag);


    if (hadTag && !hasTagNow) {
        member.roles.remove(roleID).catch(() => {});
        
        const removeEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .setAuthor({ name: "Tag Çıkarıldı!", iconURL: newUser.displayAvatarURL({ dynamic: true }) })
            .setDescription(`**${newUser} ismindeki kullanıcı, tagını kaldırarak ailemizden ayrıldı!** 😢`)
            .setFooter({ text: `Toplam Üye: ${guild.memberCount}`, iconURL: guild.iconURL({ dynamic: true }) });

        client.channels.cache.get(logID)?.send({ embeds: [removeEmbed] });
    }

    else if (!hadTag && hasTagNow) {
        member.roles.add(roleID).catch(() => {});
        
        const addEmbed = new EmbedBuilder()
            .setColor("#00ff00")
            .setAuthor({ name: "Tag Alındı!", iconURL: newUser.displayAvatarURL({ dynamic: true }) })
            .setDescription(`🎉 **${newUser} ismindeki kullanıcı, tagımızı alarak ailemize katıldı!** \`${tag}\``)
            .setFooter({ text: "Hoş Geldin!", iconURL: guild.iconURL({ dynamic: true }) });

        client.channels.cache.get(chatID)?.send({ embeds: [addEmbed] });
        client.channels.cache.get(logID)?.send({ embeds: [addEmbed] });
    }
});

		//Tagrol son





