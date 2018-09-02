
export interface Position {
    index: number,
    line: number,
    column: number
}

// -------

export interface AppState {
    openFiles: OpenFile[]
}

export interface OpenFile {
    path: string
    snippets: OpenSnippet[]
}

export interface OpenSnippet {
    range: {
        start: Position,
        end: Position
    }
    file?: OpenFile
}
