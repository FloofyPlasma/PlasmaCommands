module.exports = (command, usage) => {
    const { commandObject } = command
    const { guild, message, interaction } = usage

    if (commandObject.guildOnly && !guild) {
        const text = 'This command can only be run within a guild.'

        if (message) message.reply(text)
        else if (interaction) interaction.reply(text)

        return false
    }

    return true
}