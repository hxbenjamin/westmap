
export function vector_equals( vec1, vec2 ) {
    return vec1.length === vec2.length &&
        vec1.every( (num, idx) => num === vec2[idx]);
}

export function vector_add( vec1, vec2 ) {
    return vec1.map( (n, idx) => n + vec2[idx] );
}

export function vector_subtract( vec1, vec2 ) {
    return vec1.map( (n, idx) => n - vec2[idx] );
}

export function vector_scale( vec, scalar ) {
    return vec.map( n => n * scalar );
}