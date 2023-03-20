export interface BrowseCommand {
    key: string
    command: CommandEnum
    commandArg: string
    basePath: string
}

export enum CommandEnum {
    PREFIX,
    MATCH,
    BROWSE
}