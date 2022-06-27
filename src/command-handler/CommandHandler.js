const path = require('path')

const getAllFiles = require("../util/get-all-files")
const Command = require("./Command")
const SlashCommands = require('./SlashCommands')

class CommandHandler {
    // <commandName, instance of the Command class>
    commands = new Map()
    _validations = this.getValidations('run-time')
    _prefix = '!'

    constructor(instance, commandsDir, client) {
        this._instance = instance
        this._commandsDir = commandsDir
        this._slashCommands = new SlashCommands(client)

        this.readFiles()
        this.messageListener(client)
        this.interactionListener(client)
    }

    readFiles() {
        const files = getAllFiles(this._commandsDir)
        const validations = this.getValidations('syntax')

        for (const file of files) {
            const commandObject = require(file)

            let commandName = file.split(/[/\\]/)
            commandName = commandName.pop()
            commandName = commandName.split('.')[0]

            const {
                slash, 
                testOnly, 
                description,  
                delete: del,
                aliases = [],
            } = commandObject

            if (del) {
                if (testOnly) {
                    for (const guildId of this._instance.testServers) {
                        this._slashCommands.delete(commandName, guildId) 
                    }
                } else {
                    this._slashCommands.delete(commandName)
                }

                continue
            }

            const command = new Command(this._instance, commandName, commandObject)

            for (const validation of validations) {
                validation(command)
            }

            if (slash === true || slash === 'both') {
                const options = 
                commandObject.options || 
                this._slashCommands.createOptions(commandObject)

                if (testOnly === true) {
                    for (const guildId of this._instance.testServers) {
                        this._slashCommands.create(commandName, description, options, guildId)
                    }
                } else {
                    this._slashCommands.create(commandName, description, options)
                }
            }

           if (slash !== true) {
            const names = [command.commandName, ...aliases]

            for (const name of names) {
                this.commands.set(name, command)
            }
           }
        }

    }

    async runCommand(commandName, args, message, interaction) {
        const command = this.commands.get(commandName)
        if (!command) {
            return
        }

        const usage = { 
            message, 
            interaction,
            args, 
            text: args.join(' '), 
            guild: message ? message.guild : interaction.guild,
            member: message ? message.member : interaction.member,
            user: message ? message.author : interaction.user,
        }

        for (const validation of this._validations) {
            if (!validation(command, usage, message ? this._prefix : '/')) {
                return
            }
        }

        const { callback } = command.commandObject
        return await callback(usage)
    }

    messageListener(client) {
        client.on('messageCreate', async (message) => {
            const { content } = message

            if (!content.startsWith(this._prefix)) {
                return
            }

            const args = content.split(/\s+/)
            const commandName = args.shift().substring(this._prefix.length).toLowerCase()

           const response = await this.runCommand(commandName, args, message)
           if (response) {
            message.reply(response)
           }
        })
    }

    interactionListener(client) {
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) {
                return
            }

            const args = interaction.options.data.map(({ value }) => {
                return String(value)
            })

            const response = await this.runCommand(interaction.commandName, args, null, interaction)
            if (response) {
                interaction.reply(response)
            }
        })
    }

    getValidations(folder) {
        const validations = getAllFiles(
            path.join(__dirname, `./validations/${folder}`)
        ).map((filePath) => require(filePath)
        )

        return validations
    }
}

module.exports = CommandHandler