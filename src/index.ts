import {
	Client,
	GuildChannel,
	TextChannel,
	Message,
	MessageEmbed,
	GuildMember,
} from 'discord.js';

const client: Client = new Client();

client.on('ready', () => {
	console.log(`Connected with the user ${client.user.tag}!`);
	client.user.setPresence({
		status: 'online',
		activity: {
			name: 'waiting for messages...',
		},
	});
});

client.on('message', async (message: Message) => {
	if (message.author.bot)
		return;

	const regex = /https:\/\/discord\.com\/channels\/(?<guildID>\d{18})\/(?<channelID>\d{18})\/(?<messageID>\d{18})/;
	if (!message.content.match(regex))
		return;

	const match: RegExpMatchArray = message.content.match(regex);
	const url: string = match[0];
	const { guildID, channelID, messageID }: RegExpMatchArray['groups'] = match.groups;

	if (message.guild.id !== guildID)
		return;

	const channel: GuildChannel = message.guild.channels.cache.get(channelID);
	if (!channel && !channel.isText())
		return;

	await (channel as TextChannel).messages.fetch(messageID).then(
		(msg: Message) => {
			if (msg.embeds.length > 0)
				return;

			const member: GuildMember = msg.guild.members.cache.get(msg.author.id);
			const embed: MessageEmbed = new MessageEmbed()
				.setAuthor(`${msg.author.username}#${msg.author.discriminator}`, msg.author.avatarURL(), url)
				.setTimestamp(new Date())
				.setDescription(msg.content)
				.setColor(member?.displayColor || null)
				.setFooter(`Quoted by ${message.author.username}#${message.author.discriminator} | From #${msg.channel}`);

			if (msg.attachments && msg.attachments.size <= 25) {
				let nbrattachement = 1;
				msg.attachments.forEach((attachment) => {
					embed.addField(`Attachement ${nbrattachement}`, attachment.url);
					nbrattachement++;
				});
			}

			message.channel.send(embed)
				.then((embedMSG: Message) => {
					embedMSG.react('❌');
					embedMSG.createReactionCollector(
						(reaction, user) => user.id !== client.user.id && user.id === message.author.id && reaction.emoji.name === '❌',
					).once('collect', async () => await embedMSG.delete());
				})
				.catch(err => console.error(err));
		},
	).catch(err => console.error(err));
});

client.login(process.env.CLIENT_TOKEN);
