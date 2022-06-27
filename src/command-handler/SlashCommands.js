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

    areOptionsDifferent(options, existingOptions) {
        for (let a = 0; a < options.length; a++) {
            const option = options[a]
            const existing = existingOptions[a]

            if (option.name !== existing.name || option.type !== existing.type || option.description !== existing.description) {
                return true
            }
        }

        return false
    }

    async create(name, description, options, guildId) {
        const commands = this.getCommands(guildId)
        if (!commands) {
            return
        }

        await commands.fetch()

        const existingCommand = commands.cache.find((cmd) => cmd.name === name)
        if (existingCommand) {
            const { description: existingDescription, options: existingOptions } = existingCommand

            if (description !== existingDescription || 
                options.length !== existingOptions.length ||
                this.areOptionsDifferent(options, existingOptions)) 
            {
                console.log(`Updating "${name}"`)

                await commands.edit(existingCommand.id, {
                    name,
                    description,
                    options,
                })
            }
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