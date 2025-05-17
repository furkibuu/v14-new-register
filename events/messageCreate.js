const {Prefix} = require('../config');
const { tag } = require('../ayarlar/setting');
const talkedRecently = new Set();

module.exports =  message => {
  var prefix = Prefix
  
  if (talkedRecently.has(message.author.id)) {
    return;
  }

  
  talkedRecently.add(message.author.id);
	setTimeout(() => {
    talkedRecently.delete(message.author.id);
  }, 2500);
  var client = message.client;
  ////////////////////////////////////
 client.on("messageCreate", async(message)=>{ 
if(message.content.toLowerCase() === "tag"){


message.reply({content : `\`${tag}\``})

 }
if(message.content.toLowerCase() === ".tag"){

  message.reply({content: `\`${tag} \``})
}

})
  


  ///////////////////////////////////////
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  let command = message.content.split(' ')[0].slice(prefix.length);
  let params = message.content.split(' ').slice(1);
  let cmd;
  if (client.commands.has(command)) {
    cmd = client.commands.get(command);
  } else if (client.aliases.has(command)) {
    cmd = client.commands.get(client.aliases.get(command));
  } 
  if (cmd) {
    cmd.run(client, message, params);
    
  }
}