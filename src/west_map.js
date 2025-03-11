
import 'leaflet/dist/leaflet';

import * as hex_utils from "./hex_utils.js"
import * as leaflet_utils from './leaflet_utils.js'
import * as math_utils from './math_utils.js'



L.PositionControl = L.Control.extend({

    options: {
        position: 'bottomleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control wm-position-control');
        this._positionLabel = L.DomUtil.create('span', '', container);
        L.DomEvent.disableClickPropagation(this._positionLabel);
        container.title = "Position";
        return container;
    },

    setText: function (text) {
        this._positionLabel.innerHTML = text;
    }
});

let PoiIcon = L.Icon.extend({
    options: {
        shadowUrl: 'leaf-shadow.png',
        iconSize:     [38, 95],
        iconAnchor:   [22, 94]
    }
});


let generateTownMarker = function( latlng, label, imgUrl ) {
    window.console.log(latlng, label);
    return new L.Marker(latlng, {
        icon: new L.DivIcon({
            iconSize: [32, 32],
            className: 'wm-town-marker',
            html: '<div class="wm-town-marker-container">' +
                    `<img class="wm-town-marker-img" src="${imgUrl}"/>` +
                    `<span class="wm-town-marker-label">${label}</span>` + 
                  '</div>'
        })
    })
}

export class WestMap {

    constructor( mapData, mapUrl ) {
        const that = this; 

        this._lastHoveredHex = null; 
        this._hexagonOverlay = null; 

        this._mapData = mapData;
        this._hexagonRadius = this._mapData.metadata.hexRadius; 
        this._originOffset = this._mapData.metadata.originOffset;
        this._originHex = this._mapData.metadata.originHex;

        let bounds = [[0,0], [this._mapData.metadata.mapHeight, this._mapData.metadata.mapWidth]];

        this._map = L.map('westmap-map', {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 1,
            maxBounds: bounds,
            maxBoundsViscosity: 0.5
        });


        
        let image = L.imageOverlay(mapUrl, bounds, {
            interactive: true
        }).addTo(this._map);

        image.on('mousemove', function(e) { that._onImageLayerMouseMove(e); });

        this._map.setView( [this._mapData.metadata.mapHeight / 2, this._mapData.metadata.mapWidth / 2], -2 )

        this._positionControl = new L.PositionControl().addTo(this._map);

        this._addTownLabels();

       
    }

    localHexToPixel( axial_coords ) {
        return hex_utils.axial_to_pixel( math_utils.vector_add(axial_coords, this._originHex), this._hexagonRadius, this._originOffset);
    }

    _onImageLayerMouseMove( e ) {

        const pixel_coords = leaflet_utils.latlng_to_pixel([e.latlng.lat, e.latlng.lng]);
        const hex_coord = hex_utils.pixel_to_axial(pixel_coords, this._hexagonRadius);

        if ( hex_coord !== this._lastHoveredHex ) {
            if ( this._lastHoveredHex ) {
                this._hexagonOverlay.remove();
            }

            this._lastHoveredHex = hex_coord;
            const new_coords = hex_utils.hexagon_coords_pixel(hex_utils.axial_to_pixel(hex_coord, this._hexagonRadius, this._originOffset), this._hexagonRadius)
            this._hexagonOverlay = L.polygon(new_coords, {color: 'black'})
                .addTo(this._map);

            let origin_offset_hex = math_utils.vector_subtract( hex_coord, this._mapData.metadata.originHex )
            this._positionControl.setText( `[${origin_offset_hex[0]}, ${origin_offset_hex[1]}]` );
        }
    }

    _addTownLabels( ) {
        this._mapData.features.forEach(element => {
            if ( element.type == "town" ) {
                let latlng = leaflet_utils.pixel_to_latlng(this.localHexToPixel(element.loc));
                generateTownMarker(latlng, element.label, "/icon_town.png").addTo(this._map);
            }
        });
    }
}