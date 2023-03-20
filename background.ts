import MessageSender = chrome.runtime.MessageSender;
import Tab = chrome.tabs.Tab;
import {Settings} from "./src/browser/storage/settings";
import {SettingsStore} from "./src/browser/storage/settings-store";
import {BrowseCommand, CommandEnum} from "./src/browser/storage/BrowseCommand";



function redirect(path: string) {

    chrome.tabs.query({
        url: [
            "https://jira.erst.dk/browse/*"
        ],
    }).then((tabs) => {
        if (path.match(/[aA-zZæøåÆØÅ\d]{2,3}-\d{1,5}/i)) {
            if (tabs.some(x => x.url?.includes(path))) {
                const existingTab = tabs.find((x: Tab) => x.url?.includes(path))
                if (existingTab && existingTab.id && existingTab.windowId) {
                    chrome.tabs.update(existingTab.id, {active: true});
                    chrome.windows.update(existingTab.windowId, {focused: true});
                }
            } else {
                chrome.tabs.create({
                    url: "https://jira.erst.dk/browse/" + path
                });
            }
        } else {
            chrome.tabs.create({
                url: "https://www.google.com/search?q=" + path
            });
        }
    })
}

function handleCommand(message: any, sender: MessageSender, sendResponse: () => void): boolean | undefined {
    switch (message.command) {
        case "REDIRECT":
            redirect(message.arg)
            break
        case "UPDATE_SETTINGS":
            updateSettings(message.arg)
            break
    }

    return undefined
}

async function updateSettings(newSetting: Settings) {
    await SettingsStore.loadSettings().then((settings: Settings) => {
        const persistSetting = {
            'quickFillUseButtonMirror' : newSetting.quickFillUseButtonMirror ?? settings.quickFillUseButtonMirror,
            'extensionEnabled' : newSetting.extensionEnabled ?? settings.extensionEnabled,
            'fastbrowseEnabled' : newSetting.fastbrowseEnabled ?? settings.fastbrowseEnabled,
            'quickFillEnabled' : newSetting.quickFillEnabled ?? settings.quickFillEnabled,
            'fastbrowseCustomCommands' : newSetting.fastbrowseCustomCommands ?? settings.fastbrowseCustomCommands
        } as Settings

        SettingsStore.saveSettings(persistSetting)
    })
}

chrome.runtime.onMessage.addListener(
    function (message, sender, sendResponse) {
        return handleCommand(message, sender, sendResponse)
    }
)

chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        // read changeInfo data and do something with it
        // like send the new url to contentscripts.js
        if (changeInfo.status === 'complete') {
            if (changeInfo.url) {
                chrome.tabs.sendMessage(tabId, {
                    message: 'UPDATED',
                    url: changeInfo.url
                })
            }
        }
    }
);

chrome.tabs.onCreated.addListener(
    function (tab) {
        // read changeInfo data and do something with it
        // like send the new url to contentscripts.js
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                message: 'UPDATED'
            })
        }


    }
);

chrome.runtime.onInstalled.addListener(async () => {
    await chrome.storage.local.get(['tedHelperSettings']).then(async (data) => {
        const defaultSetting = {
            extensionEnabled :true,
            fastbrowseEnabled :true,
            fastbrowseCustomCommands : [{
                key: "YOUTUBE",
                command: CommandEnum.PREFIX,
                commandArg: 'yt',
                basePath: 'https://www.youtube.com/results?search_query='
            } as BrowseCommand],
            quickFillEnabled :true,
            quickFillUseButtonMirror :true,

        } as Settings
        if(!data.tedHelperSettings) {
            console.log(">> Installed with new settings")
            await chrome.storage.local.set({tedHelperSettings: defaultSetting})
        } else {
            console.log(">> Existing settings found" + JSON.stringify(data.tedHelperSettings))
            if(!data.tedHelperSettings.fastbrowseEnabled) {
                console.log(">> Installed with new settings")
                await chrome.storage.local.set({tedHelperSettings: defaultSetting})
            }
        }
    })
})


