import {BrowseCommand} from "./BrowseCommand";

export interface Settings {
    extensionEnabled?: boolean
    fastbrowseEnabled?: boolean
    fastbrowseUseCustom?: boolean
    quickFillEnabled?: boolean
    quickFillUseButtonMirror?: boolean
    fastbrowseCustomCommands?: BrowseCommand[]
}