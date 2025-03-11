
import 'leaflet/dist/leaflet';

import * as hex_utils from "./hex_utils.js"
import * as leaflet_utils from './leaflet_utils.js'
import * as math_utils from './math_utils.js'

import iconMarkerUrl from '../static/icon_marker.png'

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

let PoiIcon = new L.Icon({
    iconUrl: iconMarkerUrl,
    iconSize:     [32, 32],
});


let generateTownMarker = function( latlng, label, imgUrl ) {
    return new L.Marker(latlng, {
        interactive: false,
        icon: new L.DivIcon({
            interactive: false,
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
        this._lastSelectedHex = null; 

        this._selectedOverlay = null; 
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
        image.on('click', function(e) { 
            window.console.log("HELLO");
            that._onImageLayerClick(e); 
        });

        this._map.setView( [this._mapData.metadata.mapHeight / 2, this._mapData.metadata.mapWidth / 2], -2 )

        this._positionControl = new L.PositionControl().addTo(this._map);

        this._addTownLabels();
        this._addPoiMarkers();
       
    }

    localHexToPixel( axial_coords ) {
        return hex_utils.axial_to_pixel( math_utils.vector_add(axial_coords, this._originHex), this._hexagonRadius, this._originOffset);
    }

    localLatLngToHex( latlng ) {
        const pixel_coords = leaflet_utils.latlng_to_pixel([latlng.lat, latlng.lng]);
        const hex_coord = hex_utils.pixel_to_axial(pixel_coords, this._hexagonRadius);
        return math_utils.vector_subtract( hex_coord, this._mapData.metadata.originHex );
    }

    _addHexOverlay( localHex ) {
        const new_coords = hex_utils.hexagon_coords_pixel(this.localHexToPixel(localHex), this._hexagonRadius);
        return L.polygon(new_coords, {
            color: 'black',
            interactive: false
        }).addTo(this._map);
    }

    unselectTile( ) {
        if ( this._lastSelectedHex ) {
            this._lastSelectedHex = null; 
        }

        if ( this._selectedOverlay ) {
            this._selectedOverlay.remove();
            this._selectedOverlay = null; 
        }
    }

    selectTile( localHex ) {
        this._lastSelectedHex = localHex;
        this._selectedOverlay = this._addHexOverlay(localHex);
    }

    _onImageLayerMouseMove( e ) {

        const localHex = this.localLatLngToHex(e.latlng);

        if ( localHex !== this._lastHoveredHex ) {
            if ( this._lastHoveredHex && this._hexagonOverlay ) {
                this._hexagonOverlay.remove();
            }

            this._lastHoveredHex = localHex;
            const new_coords = hex_utils.hexagon_coords_pixel(this.localHexToPixel(localHex), this._hexagonRadius);
            this._hexagonOverlay = this._addHexOverlay(localHex);

            this._positionControl.setText( `[${localHex[0]}, ${localHex[1]}]` );
        }
    }

    _onImageLayerClick( e ) {
        const localHex = this.localLatLngToHex(e.latlng);

        if ( this._lastSelectedHex ) {
            if ( this._lastSelectedHex === localHex ) {

                // We are toggling the already selected tile - deselect. 
                this.unselectTile();
                
            }
            else {
                // We are selecting a new tile. Unselect the old one and select the new one
                this.unselectTile();
                this.selectTile( localHex )
            }
        }
        else {
            // We didn't already have a tile selected. Select this tile. 
            this.selectTile( localHex );
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

    _addPoiMarkers( ) {
        this._mapData.features.forEach(element => {
            if ( element.type == "poi" ) {
                let latlng = leaflet_utils.pixel_to_latlng(this.localHexToPixel(element.loc));
                L.marker(latlng, {icon: PoiIcon}).addTo(this._map);
                // generateTownMarker(latlng, element.label, "/icon_town.png").addTo(this._map);
            }
        });
    }
}