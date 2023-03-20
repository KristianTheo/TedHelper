import {SettingsStore} from "../browser/storage/settings-store";

let clicks = 0
let overlayEnabled = false
const nextStrings = [
    'næste',
    'next',
    'videre',
    'fortsæt',
    'vis resultat',
    'continue',
    'frem',
    'forward'
]

init()

async function init() {
    await SettingsStore.loadSettings().then(settings => {
        if (settings.extensionEnabled) {
            appendSearchOverlay()
            appendFormFillerOverlay()

            chrome.runtime.onMessage.addListener(
                function (request, sender, sendResponse) {
                    console.log("message")
                    // listen for messages sent from background.js
                    if (request.message === 'UPDATED') {
                        onTabUpdated()
                    }
                    if (request.message === 'ENABLE_STATE_CHANGED') {
                        init()
                    }
                    return undefined
                });

            if (settings.fastbrowseEnabled) {
                window.addEventListener("keyup", async function (event) {
                    if (event.key === "CapsLock") {
                        clicks++
                        if (clicks === 2) {
                            showSearchOverlay(true)
                        }
                    } else {
                        clicks = 0
                    }

                    if (overlayEnabled) {


                        if (event.key === "Escape") {
                            showSearchOverlay(false)
                        }

                        if (event.key === "Enter") {
                            await submitCommand()
                        }
                    }


                });
            }

            if (settings.quickFillEnabled) {
                window.addEventListener('click', (event) => {
                    onTabUpdated()
                })
                window.addEventListener('load', () => {
                    onTabUpdated()
                })
            }


            function onTabUpdated() {
                checkFormContent()
            }

            function checkFormContent() {
                const inputFields = Array.from(document.getElementsByTagName('INPUT')) as HTMLInputElement[]
                const selects = Array.from(document.getElementsByTagName('SELECT')) as HTMLSelectElement[]
                const textAreas = Array.from(document.getElementsByTagName('TEXTAREA')) as HTMLTextAreaElement[]
                const buttons = Array.from(document.getElementsByTagName('BUTTON')) as HTMLButtonElement[]
                const submitInputs = Array.from(document.querySelectorAll('[type="submit"]')) as HTMLInputElement[]

                const requiredRadios = inputFields.filter(x => !x.disabled && x.checkVisibility() && x.type === "radio")
                const requiredTextInputs = inputFields.filter(x => !x.disabled && x.checkVisibility() && x.type === "text" && x.required)
                const nonPreselectedSelects = selects.filter(x => !x.disabled && x.checkVisibility() && x.selectedIndex === 0)
                const requiredTextAreas = textAreas.filter(x => !x.disabled && x.checkVisibility() && x.required)
                const submitButtons = submitInputs.filter(x => !x.disabled && x.checkVisibility())

                const nextButtons = buttons.filter(x => !x.disabled && x.checkVisibility() && nextStrings.some(y => x.innerText.toLocaleLowerCase().includes(y)))
                const showFormHelper = requiredRadios.length > 0 || requiredTextInputs.length > 0 || nonPreselectedSelects.length > 0 || requiredTextAreas.length > 0 || submitButtons.length > 0 || nextButtons.length > 0

                const statusMap = new Map<string, number>()
                if (requiredRadios.length > 0) {
                    statusMap.set('Radio', requiredRadios.length)
                }
                if (requiredTextInputs.length > 0) {
                    statusMap.set('Input', requiredTextInputs.length)
                }
                if (nonPreselectedSelects.length > 0) {
                    statusMap.set('Select', nonPreselectedSelects.length)
                }
                if (requiredTextAreas.length > 0) {
                    statusMap.set('Text', requiredTextAreas.length)
                }


                showFormFillerOverlay(showFormHelper, statusMap)
            }

            function appendFormFillerOverlay() {
                const overlayDiv = document.createElement('div') as HTMLElement
                overlayDiv.id = 'ted-helper-formfiller-overlay-div'
                overlayDiv.style.display = 'none'

                const formFillButton = document.createElement('button') as HTMLButtonElement
                formFillButton.id = 'ted-helper-fill-button'
                formFillButton.textContent = 'Fill'
                formFillButton.className = 'ted-button ted-primary'
                formFillButton.onclick = (e) => {
                    fillForm()
                }

                overlayDiv.prepend(formFillButton)

                const body = document.getElementsByTagName('BODY')[0]
                if (body) {
                    body.prepend(overlayDiv)
                }
            }

            function showFormFillerOverlay(show: boolean, map: Map<string, number> = new Map) {

                const overlayDiv = document.getElementById('ted-helper-formfiller-overlay-div')
                if (overlayDiv) {
                    overlayDiv.style.display = show ? 'block' : 'none'
                    const buttons = Array.from(document.getElementsByTagName('BUTTON')) as HTMLButtonElement[]
                    const inputSubmit = Array.from(document.getElementsByTagName('INPUT')) as HTMLInputElement[]
                    const pageButtons = buttons.filter(x => x.checkVisibility() && !x.disabled && (nextStrings.some(y => x.innerText.toLocaleLowerCase().includes(y))))
                    const pageInputs = inputSubmit.filter(x => x.checkVisibility() && !x.disabled && x.type === 'submit')
                    pageInputs.forEach((input) => {
                        const formButton = document.createElement('button') as HTMLElement
                        formButton.id = input.id + '-ted-copy'
                        formButton.textContent = input.innerText.trim()
                        formButton.className = 'ted-button ted-secondary'
                        formButton.onclick = (e) => {
                            input.click()
                        }
                        const existing = document.getElementById(formButton.id)
                        if(!existing && !input.id.includes('-ted-copy') && !input.className.includes('ted-button')) {
                            overlayDiv.append(formButton)
                        }

                    })

                    pageButtons.forEach((button) => {
                        const formButton = document.createElement('button') as HTMLElement
                        formButton.id = button.id + '-ted-copy'
                        formButton.textContent = button.innerText.trim()
                        formButton.className = 'ted-button ted-tertiary'
                        formButton.onclick = (e) => {
                            button.click()
                        }
                        const existing = document.getElementById(formButton.id)
                        if(!existing && !button.id.includes('-ted-copy') && !button.className.includes('ted-button')) {
                            overlayDiv.append(formButton)
                        }

                    })
                }

                if (map.size > 0) {
                    let helperDiv = document.getElementById('ted-helper-status-div')
                    if (helperDiv) {

                    } else {
                        helperDiv = document.createElement('div')
                        helperDiv.id = 'ted-helper-status-div'
                    }

                    let helperString = ''
                    map.forEach((value, key) => {
                        helperString += `${key}: <span style="margin-right: 4px;">${value}</span>`
                    })

                    helperDiv.innerHTML = helperString

                    if (overlayDiv) {
                        overlayDiv.append(helperDiv)
                    }
                }
            }


            function showSearchOverlay(show: boolean) {
                const overlayDiv = document.getElementById('ted-helper-overlay-div')
                if (overlayDiv) {
                    overlayDiv.style.display = show ? 'block' : 'none'
                    overlayEnabled = show
                    const overlayInput = document.getElementById('ted-helper-overlay-input') as HTMLInputElement
                    if (overlayInput) {
                        overlayInput.focus()
                        overlayInput.select()
                    }
                }
            }

            function appendSearchOverlay() {
                const overlayDiv = document.createElement('div') as HTMLElement
                overlayDiv.id = 'ted-helper-overlay-div'


                const textInput = document.createElement('input') as HTMLInputElement
                textInput.type = 'text'
                textInput.id = 'ted-helper-overlay-input'

                overlayDiv.append(textInput)

                const body = document.getElementsByTagName('BODY')[0]
                if (body) {
                    body.prepend(overlayDiv)
                }
            }

            async function submitCommand() {
                const overlayInput = document.getElementById('ted-helper-overlay-input') as HTMLInputElement
                const arg = overlayInput.value
                await chrome.runtime.sendMessage(
                    '',
                    {command: 'REDIRECT', arg: arg},
                )
            }


            function fillForm(submitButton?: HTMLElement, nextButton?: HTMLElement) {
                const allCheckboxes = Array.from<HTMLInputElement>(document.querySelectorAll('input[type="checkbox"] ~ label'));
                if (allCheckboxes) {
                    for (let i = 0; i < allCheckboxes.length; i++) {
                        const checkboxLabel = allCheckboxes[i];
                        const sibInputPrev = checkboxLabel.previousSibling as HTMLInputElement
                        const sibInputNext = checkboxLabel.nextSibling as HTMLInputElement
                        let isChecked = false
                        if (sibInputNext && sibInputNext.tagName === 'INPUT') {
                            isChecked = sibInputNext.checked
                        } else if (sibInputPrev && sibInputPrev.tagName === 'INPUT') {
                            isChecked = sibInputPrev.checked
                        }
                        if (!isChecked) checkboxLabel.click();
                    }
                }

                const formgroupUls = document.querySelectorAll('.form-group ul');
                if (formgroupUls) {
                    for (let i = 0; i < formgroupUls.length; i++) {
                        const formgroupUl = formgroupUls[i];
                        const relativeLabels = Array.from<HTMLElement>(formgroupUl.querySelectorAll('li input ~ label'))
                        const input = Array.from<HTMLInputElement>(formgroupUl.querySelectorAll('li input'))
                        const checkbox = input.some(x => x.getAttribute('type') && x.getAttribute('type') === 'checkbox')
                        const radio = input.some(x => x.getAttribute('type') && x.getAttribute('type') === 'radio')
                        const count = relativeLabels.length;
                        if (relativeLabels) {
                            if (checkbox) {
                                getRandomArray(relativeLabels.length).forEach(num => {
                                    (relativeLabels[num] as HTMLElement).click();
                                });

                                function getRandomArray(n: number) {
                                    const length = Math.floor(Math.random() * n);
                                    const arr = [];
                                    for (let i = 0; i < length; i++) {
                                        const randomNumber = Math.floor(Math.random() * n);
                                        arr.push(randomNumber);
                                    }
                                    return arr;
                                }
                            } else if (radio) {
                                const selection = Math.floor(Math.random() * (relativeLabels.length - 1)) ?? 0
                                    if(relativeLabels) {
                                        (relativeLabels[selection] as HTMLElement).click();
                                        input[selection].checked = true
                                        input[selection].dispatchEvent(new Event('change'))
                                    }
                            }
                        }
                    }
                }

                const formgroupSelects = Array.from<HTMLSelectElement>(document.querySelectorAll('.form-group select'));
                if (formgroupSelects) {
                    for (let i = 0; i < formgroupSelects.length; i++) {
                        const selectElement = formgroupSelects[i];
                        if (selectElement.selectedIndex === 0) {
                            const options = selectElement.options;
                            const randomIndex = Math.floor(Math.random() * (options.length - 1)) + 1;
                            selectElement.selectedIndex = randomIndex;
                            selectElement.value = options[randomIndex].value
                            selectElement.dispatchEvent(new Event('change'))
                        }
                    }
                }

                const formgroupRequiredTextInput = document.querySelectorAll('.form-group input[type="text"][required]');
                if (formgroupRequiredTextInput) {
                    for (let i = 0; i < formgroupRequiredTextInput.length; i++) {
                        const inputElement = formgroupRequiredTextInput[i] as HTMLInputElement;
                        inputElement.value = 'test' + i
                    }
                }

                const formgroupRequiredEmailInput = document.querySelectorAll('.form-group input[type="email"][required]');
                if (formgroupRequiredEmailInput) {
                    for (let i = 0; i < formgroupRequiredEmailInput.length; i++) {
                        const inputElement = formgroupRequiredEmailInput[i] as HTMLInputElement;
                        inputElement.value = i + 'test@test.dk'
                    }
                }

                const formgroupRequiredPasswordInput = document.querySelectorAll('.form-group input[type="password"][required]');
                if (formgroupRequiredPasswordInput) {
                    for (let i = 0; i < formgroupRequiredPasswordInput.length; i++) {
                        const inputElement = formgroupRequiredPasswordInput[i] as HTMLInputElement;
                        inputElement.value = 'Test1234'
                    }
                }

            }
        }
    })
}


