// math_utils.js

// Return whether the elements of the supplied array are piecewise equal 
export function vector_equals( vec1, vec2 ) {
    return vec1.length === vec2.length &&
        vec1.every( (num, idx) => num === vec2[idx]);
}

// Element-wise addtion of two arrays 
export function vector_add( vec1, vec2 ) {
    return vec1.map( (n, idx) => n + vec2[idx] );
}

// Element-wise subtraction of two arrays 
export function vector_subtract( vec1, vec2 ) {
    return vec1.map( (n, idx) => n - vec2[idx] );
}

// Scale each element of the supplied array by the given scalar 
export function vector_scale( vec, scalar ) {
    return vec.map( n => n * scalar );
}