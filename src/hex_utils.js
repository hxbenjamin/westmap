// hex_utils.js 

import * as math_utils from './math_utils.js';

const sin60 = Math.sqrt(3) / 2;

// Coordinates of the flat top unit hexagon 
const unit_hexagon_coords = [
    [0, 1],
    [sin60, 0.5],
    [sin60, -0.5],
    [0, -1],
    [-sin60, -0.5],
    [ -sin60, 0.5],
]

// Convert from cubic hexagonal coordinates to axial coordinates 
export function cube_to_axial(cube_coords) {
    const q = cube_coords[0];
    const r = cube_coords[1];

    return [q, r]
}

// Convert from axial hexagonal coordinates to cubic coordinates 
export function axial_to_cube(axial_coords) {
    const q = axial_coords[0];
    const r = axial_coords[1];

    return [q, r, -q -r]
}

// Accept fractional cubic coordinates, and round to the nearest whole coordinate. 
export function round_from_cube(frac_cube) {
    const frac_q = frac_cube[0];
    const frac_r = frac_cube[1];
    const frac_s = frac_cube[2];

    let q = Math.round(frac_q);
    let r = Math.round(frac_r);
    let s = Math.round(frac_s);

    const q_diff = Math.abs(q - frac_q);
    const r_diff = Math.abs(r - frac_r);
    const s_diff = Math.abs(s - frac_s);


    if ( q_diff > r_diff && q_diff > s_diff ) {
        q = -r - s;
    }
    else if ( r_diff > s_diff ) {
        r = -q - s;
    }
    else {
        s = -q -r;
    }

    return [q, r, s]
}

// Accept fractional axial coordinates, and round to the nearest whole coordinate. 
export function round_from_axial(frac_axial) {
    return cube_to_axial( round_from_cube( axial_to_cube( frac_axial ) ) );
}

// Convert from an xy pixel coordine to an axial hex coordinate 
export function pixel_to_axial(pixel_coords, radius) {
    const x = pixel_coords[0]
    const y = pixel_coords[1]

    const q = (x * 2 / 3) / radius;
    const r = (-x / 3 + Math.sqrt(3) * y / 3) / radius;

    return round_from_axial([q,r]);
}

// Convert from an axial hex coordinate to the xy pixel coordinate at the center of the hex 
export function axial_to_pixel( axial_coords, scale, origin_offset ) {
    const q = axial_coords[0];
    const r = axial_coords[1];

    let x = scale * ( 1.5 * q );
    let y = scale * ( Math.sqrt(3) * q / 2 + Math.sqrt(3) * r )

    return [x + origin_offset[0], y + origin_offset[1]];
}


// Accept pixel coordinate and hexagon size. Return pixel coordinates of 6 points of a
// flat top hexagon centered at that point.
export function hexagon_coords_pixel( pixel_center, scale ) {

    const latlng = [pixel_center[1], pixel_center[0]];

    return unit_hexagon_coords.map( coord =>
        math_utils.vector_add( math_utils.vector_scale(coord, scale), latlng ) );
}

