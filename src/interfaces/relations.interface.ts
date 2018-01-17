export interface RelationSide {
    to: 'one' | 'many' | 'ref',
    from?: 'one' | 'many' | 'ref',
    type?: string,
    name?: string,
    reverseName?: string, // Used for input only, don't rely on it

    method?: string; // edge?, foreignKey?, array?, object?, sub-collection?

    // Foreing Key
    foreignKey?: string, // Important
    foreignField?: string,
    localKey?: string,
    localField?: string, // Important

    // Index
    isIndexed?: boolean,
    indexField?: string,

    edge?: string,
    edgeField?: string
}

// export interface RelationFullSide {
//     to: 'one' | 'many' | 'ref',
//     type: string,
//     name: string,
//     reverseName?: string, // Used for input only, don't rely on it

//     // Foreing Key
//     foreignKey?: string, // Important
//     foreignField: string,
//     localKey?: string,
//     localField: string, // Important

//     // Index
//     indexField?: string,

//     edge?: string,
//     edgeField?: string
// }

export interface RelationsDefinition {
    [from: string]: {
        [field: string]: RelationSide
    }
};

// export interface RelationsFullDefinition {
//     [from: string]: {
//         [field: string]: RelationSide
//     }
// }
