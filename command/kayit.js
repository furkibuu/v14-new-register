const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const db = require("croxydb");
const set = require("../ayarlar/setting");
const emoji = require("../ayarlar/emojis.json");
const { Footer } = require("../config");

exports.run = async (client, message, args) => {
    if (!message.member.roles.cache.has(set.registerYetkili) && !message.member.permissions.has("Administrator")) {
        return message.reply({ content: `${emoji.red} **Bu komutu kullanmak için yetkin bulunmamaktadır!**` })
            .then(msg => setTimeout(() => msg.delete(), 5000));
    }

    let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return message.reply({ content: `${emoji.red} **Bir kullanıcı belirtmelisin!**` });

    if (member.id === message.author.id) return message.reply({ content: `${emoji.red} **Kendini kayıt edemezsin!**` });
    if (member.id === message.guild.ownerId) return message.reply({ content: `${emoji.red} **Sunucu sahibini kayıt edemezsin!**` });
    if (member.roles.highest.position >= message.member.roles.highest.position) {
        return message.reply({ content: `${emoji.red} **Bu kullanıcı sizden üst/aynı pozisyondadır!**` });
    }

    if (db.get(`taglialim_${message.guild.id}`) && set.tag.some(tag => !member.user.username.includes(tag))) {
        return message.reply({ content: `${emoji.red} **Sunucumuzda taglı alım açıktır. Sadece taglı kullanıcılar kayıt edilebilir!**` });
    }


    let erkekButton = new ButtonBuilder()
        .setCustomId("erkek_kayit")
        .setLabel("👨 Erkek Olarak Kaydet")
        .setStyle("Primary");

    let kadinButton = new ButtonBuilder()
        .setCustomId("kadin_kayit")
        .setLabel("👩 Kadın Olarak Kaydet")
        .setStyle("Success");

    let iptalButton = new ButtonBuilder()
        .setCustomId("iptal_kayit")
        .setLabel("❌ İptal")
        .setStyle("Danger");

    let row = new ActionRowBuilder().addComponents(erkekButton, kadinButton, iptalButton);

    let embed = new EmbedBuilder()
        .setColor("#2F3136")
        .setAuthor({ name: "Kayıt Sistemi", iconURL: message.guild.iconURL({ dynamic: true }) })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setDescription(`
        ${emoji.kayit} **Kayıt işlemi başlatıldı!**  
        Aşağıdaki butonlardan kullanıcıyı **kadın veya erkek** olarak kaydedebilirsiniz.
        
        👤 **Kullanıcı:** ${member}  
        🆔 **ID:** \`${member.id}\`
        🎭 **En Yüksek Rol:** ${member.roles.highest}  
        🏠 **Sunucuya Katılma:** <t:${Math.floor(member.joinedAt / 1000)}:R>  
        `)
        .setFooter({ text: Footer });

    let msg = await message.reply({ embeds: [embed], components: [row] });

    const filter = i => i.user.id === message.author.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

    collector.on("collect", async interaction => {
        if (interaction.customId === "iptal_kayit") {
            return interaction.update({ content: `${emoji.red} **Kayıt işlemi iptal edildi!**`, embeds: [], components: [] });
        }

        // Modal oluşturma
        let modal = new ModalBuilder()
            .setCustomId(`kayit_modal_${interaction.customId}`)
            .setTitle("Kayıt İşlemi");

        let nameInput = new TextInputBuilder()
            .setCustomId("isim")
            .setLabel("Kullanıcının İsmi:")
            .setPlaceholder("Örn: Furkan")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        let ageInput = new TextInputBuilder()
            .setCustomId("yas")
            .setLabel("Kullanıcının Yaşı:")
            .setPlaceholder("Örn: 18")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(ageInput));

        await interaction.showModal(modal);
    });

    client.on("interactionCreate", async interaction => {
        if (!interaction.isModalSubmit()) return;

        let id = interaction.customId;
        if (!id.startsWith("kayit_modal_")) return;

        let name = interaction.fields.getTextInputValue("isim");
        let age = interaction.fields.getTextInputValue("yas");

        if (isNaN(age)) {
            return interaction.reply({ content: `${emoji.red} **Yaş sadece rakamlardan oluşmalıdır!**`, ephemeral: true });
        }

        let kayitTipi = id.replace("kayit_modal_", "");
        let rol = kayitTipi === "erkek_kayit" ? set.erkekRolleri : set.kadınRolleri;
        let kayitEmoji = kayitTipi === "erkek_kayit" ? "👨" : "👩";

        member.roles.add([rol]);
        member.roles.remove(set.kayıtsızRol);
        member.setNickname(`${set.tag} ${name} | ${age}`);

        db.add(`yetkili.${message.author.id}.${kayitTipi.includes("erkek") ? "erkek" : "kadın"}`, 1);
        db.add(`yetkili.${message.author.id}.toplam`, 1);
        let alldata = db.fetch(`yetkili.${message.author.id}.toplam`);

        let kayitEmbed = new EmbedBuilder()
            .setColor("#2F3136")
            .setAuthor({ name: "Kayıt Başarılı", iconURL: message.guild.iconURL({ dynamic: true }) })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setDescription(`
            ${kayitEmoji} **${message.author}, ${member} adlı üyeyi kayıt etti!**  
            🔹 **İsim:** \`${name}\`  
            🔹 **Yaş:** \`${age}\`  
            🔹 **Yeni Roller:** ${rol}
            📌 **Toplam Kayıt Sayısı:** \`${alldata}\`
            `)
            .setFooter({ text: Footer });

        interaction.reply({ embeds: [kayitEmbed] , ephemeral:true});

        client.channels.cache.get(set.genelChat).send(`${member} sunucumuza kayıt oldu, hoş geldin! 🎉`);
    });
};

exports.help = { name: "kayıt" };
exports.conf = { aliases: ["kayit", "register"] };
