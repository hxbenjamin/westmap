// leaflet_utils.js 

// Convert from leaflet latlng coordinates to xy pixel coordinates
export function latlng_to_pixel( latlng_coords )
{
    return [latlng_coords[1], latlng_coords[0]]
}

// Convert from xy pixel coordinates to leaflet latlng coordinates
export function pixel_to_latlng( pixel_coords )
{
    return [pixel_coords[1], pixel_coords[0]]
}