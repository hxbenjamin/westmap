import './style.css'

import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet';

import mapUrl from '../public/shipfall2.png'

import * as hex_utils from  './hex_utils.js'
import * as leaflet_utils from './leaflet_utils.js'
import {hexagon_coords_pixel} from "./hex_utils.js";

const HEXAGON_RADIUS = 50;
const ORIGIN_OFFSET = [0, -2]

let map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 1,
});

let bounds = [[0,0], [3333,4725]];
let image = L.imageOverlay(mapUrl, bounds, {
    interactive: true
}).addTo(map);


let last_hex = null;
let hexPolygon = null;
image.on('mousemove', function(e) {

    const pixel_coords = leaflet_utils.latlng_to_pixel([e.latlng.lat, e.latlng.lng]);
    const hex_coord = hex_utils.pixel_to_axial(pixel_coords, HEXAGON_RADIUS);

    if ( hex_coord !== last_hex ) {
        if ( last_hex ) {
            hexPolygon.remove();
        }

        window.console.log( hex_coord );
        window.console.log( e.latlng );
        last_hex = hex_coord;
        const new_coords = hex_utils.hexagon_coords_pixel(hex_utils.axial_to_pixel(hex_coord, HEXAGON_RADIUS, ORIGIN_OFFSET), HEXAGON_RADIUS)
        hexPolygon = L.polygon(new_coords, {color: 'black'})
            .addTo(map);
    }
})

map.setView([1600, 2300], -2);


