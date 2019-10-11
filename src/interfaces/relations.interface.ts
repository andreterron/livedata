export interface RelationSide {
    to: 'one' | 'many' | 'ref',
    from?: 'one' | 'many' | 'ref',
    type?: string,
    name?: string,
    plural?: string,
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

export interface RelationDefinition {
    name: string
    plural?: string,
    reverseName?: string

    to: 'one' | 'many' | 'ref'
    from?: 'one' | 'many' | 'ref'

    toType: string
    fromType?: string

    method?: string

    edge?: {
        name: string
        localKey: string
        localField: string
        foreignKey: string
        foreignField: string
    }

    indexField?: string
    
    // Foreing Key
    foreignKey?: string // Important
    foreignField?: string
    localKey: string
    localField: string // Important

    // index
    // method extra
}

export interface RelationPartial extends RelationInputObject {
    name: string
    to: 'one' | 'many' | 'ref'
    toType: string
}

export interface RelationInputObject {
    name?: string
    plural?: string,
    reverseName?: string

    to?: 'one' | 'many' | 'ref'
    from?: 'one' | 'many' | 'ref'

    toType?: string
    fromType?: string

    method?: string

    edge?: string | {
        name: string
        localKey?: string
        localField?: string
    }

    // Index
    isIndexed?: boolean,
    indexField?: string,

    // Foreing Key
    foreignKey?: string, // Important
    foreignField?: string,
    localKey?: string,
    localField?: string, // Important

//     name?: string
//     to?: 'one' | 'many' | 'ref'
//     method?: string
}

export type RelationInput = string | RelationInputObject

// export interface RelationsFullDefinition {
//     [from: string]: {
//         [field: string]: RelationSide
//     }
// }
