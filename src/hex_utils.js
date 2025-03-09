

export function cube_to_axial(cube_coords) {
    const q = cube_coords[0];
    const r = cube_coords[1];

    return [q, r]
}

export function axial_to_cube(axial_coords) {
    const q = axial_coords[0];
    const r = axial_coords[1];

    return [q, r, -q -r]
}

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

export function round_from_axial(frac_axial) {
    return cube_to_axial( round_from_cube( axial_to_cube( frac_axial ) ) );
}

export function pixel_to_axial(pixel_coords, radius) {
    var x = pixel_coords[0]
    var y = pixel_coords[1]

    var q = (x * 2 / 3) / radius;
    var r = (-x / 3 + Math.sqrt(3) * y / 3) / radius;

    return round_from_axial([q,r]);
}

export function axial_to_pixel( axial_coords, scale, origin_offset ) {
    const q = axial_coords[0];
    const r = axial_coords[1];

    let x = scale * ( 1.5 * q );
    let y = scale * ( Math.sqrt(3) * q / 2 + Math.sqrt(3) * r )

    return [x + origin_offset[0], y + origin_offset[1]];
}

export function hexagon_coords_pixel( origin, scale ) {

    const sin60 = scale * Math.sqrt(3) / 2;
    const lat = origin[1]
    const long = origin[0]


    return [
        [0 + lat, scale + long],
        [sin60+ lat, 0.5 * scale+ long],
        [ sin60+ lat, -scale / 2 + long],
        [0+ lat, -scale + long],
        [-sin60+ lat,-scale / 2 + long],
        [ -sin60+ lat, scale / 2 + long],
    ]
}
