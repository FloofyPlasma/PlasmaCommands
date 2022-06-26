module.exports = (command) => {
    const { commandName, commandObject } = command

    if (commandObject.slash === true || commandObject.slash === 'both') {
        if (!commandObject.description) {
            throw new Error (`Command "${commandName}" is a slash command but does not have a description`)
        }
    }
}