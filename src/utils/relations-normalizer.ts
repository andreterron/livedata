import { RelationsDefinition } from "../interfaces/relations.interface";

export class RelationsNormalizer {

    format(name: string, options?: any): string {
        let replace = (str: string, char?: string) => {
            return str.replace(/([a-z])[-_ ]?([A-Z])/g, (_, $1, $2): string => {
                if (char) {
                    return `${$1}${char}${$2.toLowerCase()}`;
                } else {
                    return `${$1}${$2.toUpperCase()}`;
                }
            });
        }
        switch (options && options.namingConvention || undefined) {
            case 'underline':
                return replace(name, '_');
            case 'dash':
                return replace(name, '-');
            case 'space':
                return replace(name, ' ');
            case 'camelCase':
                return replace(name);
            default:
                return name;
        }
    }
    
    plural(name: string): string {
        // common exceptions
        if (name === 'child') return 'children';
        // default
        if (name.endsWith('s')) {
            return name;
        } else {
            return name + 's';
        }
    }
    
    normalizeRelations(relations: RelationsDefinition) {
        // Add from relations
        for (var from in relations) {
            for (var fromName in relations[from]) {
                let rel = relations[from][fromName];
                let to = rel.type || fromName;
                let toName = rel.reverseName || from;
                // Creates reference reverse relation if it doesn't exist
                if (!relations[to] || !relations[to][toName]) {
                    relations[to] = relations[to] || {}
                    relations[to][toName] = {to: 'ref'};
                }
                let rev = relations[to][toName];
    
                // Check relation type
                if (rel.to === 'many') {
                    // names
                    rel.name = rel.name || fromName;
                    rev.name = rev.name || rel.reverseName || from;
                    if (rel.name === rev.name) {
                        rel.name = this.format(rel.name + '_to');
                        rev.name = this.format(rev.name + '_from');
                    }
    
                    // relation
                    rel.foreignKey = rel.foreignKey || this.format(`${rev.name}_id`);
                    rel.localField = rel.localField || this.format(this.plural(rel.name));
                    if (rel.isIndexed) {
                        rel.indexField = rel.indexField || this.format(`${rev.name}_index`);
                    }
                    if (rev.to === 'one') {
                        // console.warn(`Relation Mismatch! ${from}->${fromName} is one-to-many, ${to}->${toName} should be have property 'to' = 'ref'`);
                        rev.to = 'ref';
                    }
                    if (rev.to === 'ref') {
                        rev.localKey = rel.foreignKey;
                        rev.localField = rev.localField || this.format(rev.name);
                    } else if (rev.to === 'many') {
                        // let edge = rel.edge || this.formatFieldName(rel.name || `${from}_${to}_edge`);
                        rel.edge = this.format(rel.name || `${from}_${fromName}_edge`);
                        relations[rel.edge] = relations[rel.edge] || {};
                        let edgeFrom = relations[rel.edge][toName] = relations[rel.edge][toName] || {to: 'ref'};
                        let edgeTo = relations[rel.edge][fromName] = relations[rel.edge][fromName] || {to: 'ref'};
                        if (from === to) {
                            edgeFrom.localField = edgeFrom.localField || this.format(rev.name);
                            edgeFrom.localKey = edgeFrom.localKey || rel.foreignKey;
                            edgeTo.localField = edgeTo.localField || this.format(rel.name);
                            edgeTo.localKey = edgeTo.localKey || rev.foreignKey;
                        } else {
                            edgeFrom.localField = edgeFrom.localField || this.format(rev.name);
                            edgeFrom.localKey = edgeFrom.localKey || rel.foreignKey;
                            edgeTo.localField = edgeTo.localField || this.format(rel.name);
                            edgeTo.localKey = edgeTo.localKey || rev.foreignKey;
                        }
                        rel.foreignKey = rel.foreignKey || this.format(`${from}_id`);
                        rel.foreignField = rel.foreignField || this.format(from);
                        rel.localField = rel.localField || this.format(this.plural(from));
                    }
                    // if rev is to one
                    //     ensure reverse ref relation
                    // else if rev is to many
                    //     ???
                } else if (rel.to === 'one') {
                    
                } else if (rel.to === 'ref') {
                    // Probably nothing to do here
                }
            }
        }
        // this.relations = relations;
    }
}