import {Settings} from "../browser/storage/settings";
import {SettingsStore} from "../browser/storage/settings-store";
import elements = chrome.devtools.panels.elements;


const fastBrowseEnabledSlider = document.getElementById('ted-helper-fastbrowse-slider') as HTMLInputElement
const mirrorButtonsEnabledSlider = document.getElementById('ted-helper-mirrorbuttons-slider') as HTMLInputElement
const quickFillEnabledSlider = document.getElementById('ted-helper-quickfill-slider') as HTMLInputElement
const enabledSlider = document.getElementById('ted-helper-enabled-slider') as HTMLInputElement

init()

async function init() {
    const settings = await chrome.storage.local.get(['tedHelperSettings']).then((result) => {
        return result.tedHelperSettings as Settings
    })

    setEnabledSlider(settings.extensionEnabled ?? true);
    fastBrowseEnabledSlider.checked = settings.fastbrowseEnabled ?? true
    quickFillEnabledSlider.checked = settings.quickFillEnabled ?? true
    mirrorButtonsEnabledSlider.checked = settings.quickFillUseButtonMirror ?? true
}


if(enabledSlider) {
    enabledSlider.addEventListener('change', (ev) => {
        setEnabledSlider(enabledSlider.checked)
        chrome.runtime.sendMessage('',
            {command: 'UPDATE_SETTINGS', arg: {extensionEnabled: enabledSlider.checked} as Settings})
    })
}

if(fastBrowseEnabledSlider) {
    fastBrowseEnabledSlider.addEventListener('change', (ev) => {
        chrome.runtime.sendMessage('',
            {command: 'UPDATE_SETTINGS', arg: {fastbrowseEnabled: fastBrowseEnabledSlider.checked} as Settings})
    })
}

if(quickFillEnabledSlider) {
    quickFillEnabledSlider.addEventListener('change', (ev) => {
        chrome.runtime.sendMessage('',
            {command: 'UPDATE_SETTINGS', arg: {quickFillEnabled: quickFillEnabledSlider.checked} as Settings})
    })
}

if(mirrorButtonsEnabledSlider) {
    mirrorButtonsEnabledSlider.addEventListener('change', (ev) => {
        chrome.runtime.sendMessage('',
            {command: 'UPDATE_SETTINGS', arg: {quickFillUseButtonMirror: mirrorButtonsEnabledSlider.checked} as Settings})
    })
}



function setEnabledSlider(enabled : boolean) {
    const enabledSlider = document.getElementById('ted-helper-enabled-slider') as HTMLInputElement
    const subSectionSettings = document.getElementById('ted-popup-subsection') as HTMLElement
    enabledSlider.checked = enabled
    chrome.action.setBadgeText({text: (enabled  ? '' : 'off')})
    if(subSectionSettings) {
        subSectionSettings.style.opacity = enabled ? '1' : '0.3'
    }
}
