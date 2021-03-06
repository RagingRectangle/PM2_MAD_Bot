const {
    Client,
    Intents,
    MessageEmbed,
    Permissions,
    MessageActionRow,
    MessageButton
} = require('discord.js');
const fs = require('fs');
const pm2 = require('pm2');
const config = require('./config.json');

module.exports = {
    updateButtons: async function updateButtons(channelOrInteraction, type) {
        pm2.connect(async function (err) {
            if (err) {
                console.error(err)
                return;
            }
            pm2.list((err, response) => {
                if (err) {
                    console.error("pm2.list error:", err);
                    pm2.disconnect();
                    return;
                }
                var buttonList = [];
                response.forEach(process => {
                    var buttonStyle = process['status'];
                    if (buttonStyle === undefined) {
                        buttonStyle = process['pm2_env']['status']
                    }
                    buttonStyle = buttonStyle.replace('online', 'SUCCESS').replace('stopping', 'DANGER').replace('stopped', 'DANGER').replace('launching', 'SUCCESS').replace('errored', 'DANGER').replace('one-launch-status', 'DANGER');
                    let buttonLabel = process['name'];
                    let buttonID = `${config.serverName}_process_reload_${buttonLabel}`;
                    let button = new MessageButton().setCustomId(buttonID).setLabel(buttonLabel).setStyle(buttonStyle);
                    if (!config.pm2.ignore.includes(buttonLabel)) {
                        buttonList.push(button);
                    }
                }) //End of response.forEach
                var rowsNeeded = Math.ceil(buttonList.length / 5);
                if (rowsNeeded > 4){
                    rowsNeeded = 4;
                }
                var buttonsNeeded = buttonList.length;
                if (buttonsNeeded > 19){
                    buttonsNeeded = 19;
                }
                var buttonCount = 0;
                var messageComponents = [];
                for (var n = 0; n < rowsNeeded && n < 4; n++) {
                    var buttonRow = new MessageActionRow()
                    for (var r = 0; r < 5; r++) {
                        if (buttonCount < buttonsNeeded) {
                            buttonRow.addComponents(buttonList[buttonCount]);
                            buttonCount++;
                        }
                    } //End of r loop
                    messageComponents.push(buttonRow);
                } //End of n loop
                pm2.disconnect();
                let optionRow = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId(`${config.serverName}_reload`).setLabel(`Reload`).setStyle("PRIMARY"),
                    new MessageButton().setCustomId(`${config.serverName}_start`).setLabel(`Start`).setStyle("SUCCESS"),
                    new MessageButton().setCustomId(`${config.serverName}_stop`).setLabel(`Stop`).setStyle("DANGER"),
                    new MessageButton().setCustomId(`${config.serverName}_status`).setLabel(`Status`).setStyle("SECONDARY")
                )
                messageComponents.push(optionRow);
                if (type === 'new') {
                    channelOrInteraction.send({
                        content: `**Status of ${config.serverName} Processes:**\n*Click to reload*`,
                        components: messageComponents
                    });
                }
                else if (type === 'edit'){
                    channelOrInteraction.message.edit({
                        content: `**Status of ${config.serverName} Processes:**\n*Click to reload*`,
                        components: messageComponents
                    });
                }
            }) //End of pm2.list
        }) //End of pm2.connect
    }, //End of updateButtons()
}