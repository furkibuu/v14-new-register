const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const db = require("croxydb");
const set = require("../ayarlar/setting");
let emoji = require("../ayarlar/emojis.json");
const { Footer } = require("../config");

exports.run = async (client, message, args) => {
    if (!message.member.roles.cache.has(set.registerYetkili) && !message.member.permissions.has("Administrator")) {
        return message.reply({ 
            content: `${emoji.red} **Bu komutu kullanmak için yetkin bulunmamaktadır!**` 
        }).then(e => setTimeout(() => { if (e.deletable) e.delete(); }, 10000));
    }

    const erkek = db.fetch(`yetkili.${message.author.id}.erkek`) || "0";
    const kadın = db.fetch(`yetkili.${message.author.id}.kadın`) || "0";
    const kayıtlar = db.fetch(`yetkili.${message.author.id}.toplam`) || "0";

    const kayıtEmbed = new EmbedBuilder()
    .setAuthor({ name: "📋 Kayıt Bilgileri", iconURL: message.author.displayAvatarURL({ dynamic: true }) })
    .setColor("#2F3136")
    .setThumbnail("https://cdn-icons-png.flaticon.com/512/1828/1828640.png") // Buraya hoş bir ikon ekledim
    .setDescription(`
    👤 **Yetkili:** ${message.author}  
    📌 **Toplam Kayıt Sayısı:** \`${kayıtlar}\`  
    👨 **Erkek Kayıt Sayısı:** \`${erkek}\`  
    👩 **Kadın Kayıt Sayısı:** \`${kadın}\`  
    
    🔽 **Aşağıdaki menüden detayları görüntüleyebilirsin!**
    `)
    .setFooter({ text: Footer, iconURL: client.user.displayAvatarURL() });

const kayıtMenu = new StringSelectMenuBuilder()
    .setCustomId("kayıt_bilgi")
    .setPlaceholder("📊 Kayıt bilgilerini görüntülemek için seçim yap!")
    .addOptions([
        { label: "📌 Toplam Kayıt", value: "toplam", description: `Toplam: ${kayıtlar}`, emoji: "📌" },
        { label: "👨 Erkek Kayıtlar", value: "erkek", description: `Erkek: ${erkek}`, emoji: "👨" },
        { label: "👩 Kadın Kayıtlar", value: "kadın", description: `Kadın: ${kadın}`, emoji: "👩" }
    ]);

const row = new ActionRowBuilder().addComponents(kayıtMenu);

const msg = await message.reply({ embeds: [kayıtEmbed], components: [row] });

const filter = (interaction) => interaction.isStringSelectMenu() && interaction.customId === "kayıt_bilgi";
const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

collector.on("collect", async (interaction) => {
    if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: `${emoji.red} **Bu menüyü kullanma yetkin yok!**`, ephemeral: true });
    }

    let updatedEmbed = new EmbedBuilder().setColor("#2F3136").setFooter({ text: Footer, iconURL: client.user.displayAvatarURL() });

    if (interaction.values[0] === "toplam") {
        updatedEmbed.setTitle("📌 Toplam Kayıt Sayısı").setDescription(`📊 **Toplam Kayıt Sayısı:** \`${kayıtlar}\``);
    } else if (interaction.values[0] === "erkek") {
        updatedEmbed.setTitle("👨 Erkek Kayıt Sayısı").setDescription(`👨 **Erkek Kayıt Sayısı:** \`${erkek}\``);
    } else if (interaction.values[0] === "kadın") {
        updatedEmbed.setTitle("👩 Kadın Kayıt Sayısı").setDescription(`👩 **Kadın Kayıt Sayısı:** \`${kadın}\``);
    }

    await interaction.update({ embeds: [updatedEmbed], components: [row] });
});

collector.on("end", () => {
    msg.edit({ components: [] }).catch(() => {});
});
};

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: ["kayıtsayı", "kayıtbilgi"]
};

exports.help = {
    name: "kayıt-sayı",
    description: "Kullanıcının kayıt bilgilerini görüntüler.",
    usage: "!kayıt-sayı"
};
