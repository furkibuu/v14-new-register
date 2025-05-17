const { EmbedBuilder } = require("discord.js");
const db = require("croxydb");
const { Footer } = require("../config");

exports.run = async (client, message, args) => {
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

    let erkek = db.fetch(`yetkili.${member.id}.erkek`) || "0";
    let kadın = db.fetch(`yetkili.${member.id}.kadın`) || "0";
    let kayıtlar = db.fetch(`yetkili.${member.id}.toplam`) || "0";

    let profilEmbed = new EmbedBuilder()
        .setColor("#2F3136") // Koyu gri tonu, hoş bir görünüm sağlıyor
        .setAuthor({
            name: `${member.user.username} • Kullanıcı Profili`,
            iconURL: member.user.displayAvatarURL({ dynamic: true })
        })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setDescription(`
        👤 **Kullanıcı:** <@${member.id}>  
        🆔 **Kullanıcı ID:** \`${member.id}\`  
        🎭 **En Yüksek Rol:** ${member.roles.highest}  
        📅 **Hesap Kurulum:** <t:${Math.floor(member.user.createdTimestamp / 1000)}> (<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>)  
        🏠 **Sunucuya Katılma:** <t:${Math.floor(member.joinedAt / 1000)}> (<t:${Math.floor(member.joinedAt / 1000)}:R>)  
        🏅 **Roller:** ${member.roles.cache.size > 1 ? member.roles.cache.filter(r => r.name !== "@everyone").map(r => r).join(", ") : "Üzerinde Hiç Rol Bulunmamakta!"}  
        🌟 **Avatar:** [🔗 Tıkla](${member.user.displayAvatarURL({ dynamic: true, size: 1024 })})

        📌 **Kayıt Verileri**  
        📊 **Toplam Kayıt Sayısı:** \`${kayıtlar}\`  
        👨 **Erkek Kayıt Sayısı:** \`${erkek}\`  
        👩 **Kadın Kayıt Sayısı:** \`${kadın}\`
        `)
        .setFooter({ text: Footer, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    message.reply({ embeds: [profilEmbed] });
};

exports.help = {
    name: "profil",
    description: "Kullanıcının profil bilgilerini gösterir.",
    usage: "!profil"
};

exports.conf = {
    aliases: ["profil", "profile"]
};
