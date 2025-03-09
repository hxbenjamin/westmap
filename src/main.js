import './style.css'

import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet';

import map_data from '../public/map_data.json'
import mapUrl from '../public/shipfall2.png'

import * as hex_utils from  './hex_utils.js'
import * as leaflet_utils from './leaflet_utils.js'
import * as math_utils from './math_utils.js'

const HEXAGON_RADIUS = 50;
const ORIGIN_OFFSET = [0, -2]


let map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 1,
});


let bounds = [[0,0], [map_data.metadata.mapHeight, map_data.metadata.mapWidth]];
let image = L.imageOverlay(mapUrl, bounds, {
    interactive: true
}).addTo(map);


map.setView([1600, 2300], -2);

// var myIcon = L.divIcon({html: "<span>HELLO</span>", className: 'my-div-icon'});
// L.marker([1000, 1000], {icon: myIcon}).addTo(map);


L.PositionControl = L.Control.extend({

    options: {
        position: 'bottomleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control wm-position-control');
        this._positionLabel = L.DomUtil.create('span', '', container);
        // this._positionLabel.innerHTML = "Hello, World!";
        L.DomEvent.disableClickPropagation(this._positionLabel);
        container.title = "Position";
        return container;
    },

    setText: function (text) {
        this._positionLabel.innerHTML = text;
    }
});

let positionControl = new L.PositionControl().addTo(map);




let last_hex = null;
let hexPolygon = null;
image.on('mousemove', function(e) {

    const pixel_coords = leaflet_utils.latlng_to_pixel([e.latlng.lat, e.latlng.lng]);
    const hex_coord = hex_utils.pixel_to_axial(pixel_coords, HEXAGON_RADIUS);

    if ( hex_coord !== last_hex ) {
        if ( last_hex ) {
            hexPolygon.remove();
        }

        last_hex = hex_coord;
        const new_coords = hex_utils.hexagon_coords_pixel(hex_utils.axial_to_pixel(hex_coord, HEXAGON_RADIUS, ORIGIN_OFFSET), HEXAGON_RADIUS)
        hexPolygon = L.polygon(new_coords, {color: 'black'})
            .addTo(map);

        window.console.log( hex_coord );

        let origin_offset_hex = math_utils.vector_subtract( hex_coord, map_data.metadata.originHex )
        positionControl.setText( `[${origin_offset_hex[0]}, ${origin_offset_hex[1]}]` );
    }
})







