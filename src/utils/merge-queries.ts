export function mergeQueries(...queries) {
    let query: any = {};
    queries.forEach(q => {
        if (q) {
            let w = query.where || {};
            Object.assign(query, q, {where: Object.assign(w, q.where || {})});
        }
        // Object.keys(q).forEach(k => {
        //     query[k] = Object.assign(query[k] || {}, q[k]);
        // })
    });
    return query;
}