class SlashCommands {
    constructor(client) {
        this._client = client
    }

    getCommands(guildId) {
        if (guildId) {
            return this._client.guilds.cache.get(guildId)?.commands
        }

        return this._client.application?.commands
    }

    async create(name, description, options, guildId) {
        const commands = this.getCommands(guildId)
        if (!commands) {
            return
        }

        await commands.fetch()

        const existingCommand = commands.cache.find((cmd) => cmd.name === name)
        if (existingCommand) {
            // TODO: Update the slash command
            console.log(`Ignoring command "${name}" as it already exists.`)
            return
        }

        return await commands.create({
            name,
            description,
            options
        })
    }

    async delete(commandName, guildId) {
        const commands = this.getCommands(guildId)
        if (!commands) {
            return
        }

        await commands.fetch()

        const targetCommand = commands.cache.find((cmd) => cmd.name === commandName)
        if (!targetCommand) {
            return
        }

        targetCommand.delete()
    }

    createOptions({ expectedArgs = '', minArgs = 0 }) {
        const options = []

        // <num 1> <num 2>

        const split = expectedArgs
            // removing the start < or [ and ending > or ]
            .substring(1, expectedArgs.length - 1)
            // num 1> <num 2
            .split(/[>\]\)] [<\[\(]/)
            // ['num 1', 'num 2']

        for (let a = 0; a < split.length; ++ a) {
            const item = split[a]

            options.push({
                name: item.toLowerCase().replace(/\s+/g, '-'),
                description: item,
                type: 'STRING',
                required: a < minArgs,
            })
        }

        return options
    }
}

module.exports = SlashCommands