import {Settings} from "./settings";

export class SettingsStore {

    static saveSettings(newSettings: Settings) {
        chrome.storage.local.set({tedHelperSettings: newSettings})
    }

     static async loadSettings() : Promise<Settings> {
        let setting = {} as Settings
        await chrome.storage.local.get(['tedHelperSettings']).then((result) => {
            setting = result.tedHelperSettings
        })

         return setting
    }
}