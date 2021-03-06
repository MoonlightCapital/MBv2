const commands = require('../wildbeast-internals/command-loader').commands
const aliases = require('../wildbeast-internals/command-loader').alias
const timeout = require('../features/timeout')
const perms = require('../features/perms')
const inq = require('../megabot-internals/inquirer')

module.exports = async (ctx) => {
  const msg = ctx[0]
  if (msg.author.bot) return
  const prefix = process.env.BOT_PREFIX
  if (!msg.content.startsWith(prefix) && msg.channel.guild && msg.content.match(MB_CONSTANTS.regex)) inq.createChatvote(msg, msg.content.match(MB_CONSTANTS.regex)[1])
  if (msg.content.indexOf(prefix) === 0) {
    let cmd = msg.content.substr(prefix.length).split(' ')[0].toLowerCase()
    if (aliases.has(cmd)) cmd = aliases.get(cmd)
    if (commands[cmd]) {
      const suffix = msg.content.substr(prefix.length).split(' ').slice(1).join(' ')
      if (!msg.channel.guild && commands[cmd].meta.noDM) return msg.channel.createMessage('You cannot use this command in DMs')
      let time = true
      if (commands[cmd].meta.timeout) time = timeout.calculate(msg.author.id, cmd, commands[cmd].meta.timeout)
      if (time !== true) return msg.channel.createMessage(`This command is still on cooldown, try again in ${Math.floor(time)} seconds.`)
      const allowed = perms(commands[cmd].meta.level, (msg.channel.guild ? msg.member : msg.author), msg)
      global.logger.debug(`Access: ${allowed}`)
      if (allowed) {
        try {
          commands[cmd].fn(msg, suffix)
        } catch (e) {
          global.logger.error(e)
          msg.channel.createMessage('An error occurred processing this command, please try again later.')
        } finally {
          global.logger.command({
            cmd: cmd,
            opts: suffix,
            m: msg
          })
        }
      } else {
        // msg.channel.createMessage('You have no permission to run this command!')
      }
    }
  }
}
