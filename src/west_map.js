// west_map.js

import 'leaflet/dist/leaflet';
import * as marked from 'marked';

import * as hex_utils from "./hex_utils.js"
import * as leaflet_utils from './leaflet_utils.js'
import * as math_utils from './math_utils.js'

import iconPoiNormalUrl from '../static/crosshair.svg'
import iconPoiQuestionUrl from '../static/crosshair_question.svg'

// Control which shows the current selected tile in the bottom left 
L.PositionControl = L.Control.extend({

    options: {
        position: 'bottomleft'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control wm-position-control');
        this._positionLabel = L.DomUtil.create('span', '', container);
        this._positionLabel.innerHTML = "[0, 0]";
        L.DomEvent.disableClickPropagation(this._positionLabel);
        container.title = "Position";
        return container;
    },

    setText: function (text) {
        this._positionLabel.innerHTML = text;
    }
});


// Class representing the 'information' pane. 
export class WestMapInfoPane {
    constructor( rootElem ) {
        const that = this;
        this._rootElem = rootElem;
    }

    _getTitleElem() {
        return this._rootElem.querySelector("#wm-panel-title span");
    }

    setTitle( title ) {
        this._getTitleElem().innerHTML = title;
    }

    clearTitle() {
        this._getTitleElem().innerHTML = "";
    }

    _getContentElem() {
        return document.getElementById("wm-panel-content");
    }

    setContent( markdown_text ) {
        this._getContentElem().innerHTML = marked.parse(markdown_text);
    }

    clearContent() {
        this._getContentElem().innerHTML = "";
    }
}

// Class representing the map element. 
export class WestMap {

    constructor( mapData, mapUrl, infoPanel ) {
        const that = this;

        // Coordinates of the current selected and hovered hexes 
        this._lastHoveredHex = null; 
        this._lastSelectedHex = null; 
        
        // Overlay elements of the current tile hover and tile selection 
        this._selectedOverlay = null; 
        this._hexagonOverlay = null; 
        
        // The current point-of-interest 
        this._poiMarkers = [];
        this._iconObjs = {};

        this._mapData = mapData;
        this._infoPanel = infoPanel;

        // Helper accessors into the mapData object 
        this._hexagonRadius = this._mapData.metadata.hexRadius; 
        this._originOffset = this._mapData.metadata.originOffset;
        this._originHex = this._mapData.metadata.originHex;

        // Create our icon objects
        this._generateIcons();

        // Set the bounds of the map equal to the pixel size of the supplied image, with a little extra to allow
        // panning slightly outside the map
        const extraBounds = 100;
        let bounds = [[0,0], [this._mapData.metadata.mapHeight, this._mapData.metadata.mapWidth]];
        let outerBounds = [
            [-extraBounds,
                -extraBounds],
            [this._mapData.metadata.mapHeight + 2* extraBounds,
                this._mapData.metadata.mapWidth + 2*extraBounds]
        ];

        this._map = L.map('westmap-map', {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 1,
            maxBounds: outerBounds,
            maxBoundsViscosity: 0.5,
            attributionControl: false
        });

        // The main backing image - hex map and terrain
        let image = L.imageOverlay(mapUrl, bounds, {
            interactive: true
        }).addTo(this._map);

        // Wire up event handlers 
        image.on('mousemove', function(e) { that._onImageLayerMouseMove(e); });
        image.on('click', function(e) { that._onImageLayerClick(e); });
        this._map.on( "zoomend", e => that._onZoomEnd(e) ); 

        // Populate the map with info from our map_data json
        this._addPoiMarkers();
        this._addExploredTileOverlay()


        // Create the bottom right 'position' control
        this._positionControl = new L.PositionControl().addTo(this._map);


        // Create the top-left 'layers' control.
        let overlayMaps = {
            "Towns": this._townLayerGroup,
            "POIs": this._poiLayerGroup,
            "Explored Tiles": this._exploredTileLayerGroup
        }

        this._layerControl = L.control.layers(null, overlayMaps, {
            position: 'topleft',
            collapsed: false
        }).addTo(this._map);


        // Center the view on the center of the map by default 
        this._map.setView( [this._mapData.metadata.mapHeight / 2, this._mapData.metadata.mapWidth / 2], -2 )
    }

    // Accept an axial coordinate relative to the custom hex origin, and retun the xy pixel coordinate of its center
    localHexToPixel( axial_coords ) {
        return hex_utils.axial_to_pixel( math_utils.vector_add(axial_coords, this._originHex), this._hexagonRadius, this._originOffset);
    }

    // Accept a leaflet lat-long coordinate, convert it to a local-origin relative hex coordinate 
    localLatLngToHex( latlng ) {
        const pixel_coords = leaflet_utils.latlng_to_pixel([latlng.lat, latlng.lng]);
        const hex_coord = hex_utils.pixel_to_axial(pixel_coords, this._hexagonRadius);
        return math_utils.vector_subtract( hex_coord, this._mapData.metadata.originHex );
    }

    // Create and return a hexagonal overlay at the given axial coordinate 
    _createHexOverlay(localHex, props ) {
        const screenspace_coords = hex_utils.hexagon_coords_pixel(this.localHexToPixel(localHex), this._hexagonRadius);
        return L.polygon(screenspace_coords, Object.assign({
            interactive: false
        }, props));
    }

    _createHexLayerGroup(hex_tiles, props) {
        const that = this;
        let layers = hex_tiles.map( tile => { return that._createHexOverlay(tile, props) });
        return L.layerGroup(layers, {});
    }

    _onZoomEnd( e ) {
        const that = this;
        const currentZoom = this._map.getZoom();
        const isMinZoom = currentZoom === this._map.getMinZoom();

        // Toggle between the big and small POI markers on zoom change so that they don't end 
        // up too big compared to the min-zoom map hexes

        this._poiMarkers.forEach( m => {

            let svgName = m.svgName;
            if ( isMinZoom ) {
                svgName = svgName + "-small";
            }

            m.marker.setIcon(that._iconObjs[svgName]);
        });
    }

    // Unselect the currently selected tile. 
    unselectTile( ) {
        if ( this._lastSelectedHex ) {
            this._lastSelectedHex = null; 
        }

        if ( this._selectedOverlay ) {
            this._selectedOverlay.remove();
            this._selectedOverlay = null; 
        }

        this._infoPanel.clearTitle();
        this._infoPanel.clearContent();
    }

    // Select the supplied tile, adding an overlay and updating the information pane 
    selectTile( localHex ) {
        this._lastSelectedHex = localHex;
        this._selectedOverlay = this._createHexOverlay(localHex, {color:"black"}).addTo(this._map);

        // TODO: replace with map lookup 
        const that = this;
        this._mapData.features.some( f => {
            if ( math_utils.vector_equals( f.loc, localHex ) ) {
                that._infoPanel.setTitle( f.label );

                if ( f.desc ) {
                    that._infoPanel.setContent(f.desc);
                }

                return true;
            }
        });
    }

    _onImageLayerMouseMove( e ) {

        const localHex = this.localLatLngToHex(e.latlng);
        
        if ( !this._lastHoveredHex || !math_utils.vector_equals(localHex, this._lastHoveredHex) ) {
            if ( this._hexagonOverlay ) {
                this._hexagonOverlay.remove();
            }

            this._lastHoveredHex = localHex;
            this._hexagonOverlay = this._createHexOverlay(localHex, {
                color: "black",
                stroke: false
            }).addTo(this._map);

            this._positionControl.setText( `[${localHex[0]}, ${localHex[1]}]` );
        }
    }

    _onImageLayerClick( e ) {
        const localHex = this.localLatLngToHex(e.latlng);

        if ( this._lastSelectedHex ) {
            if ( math_utils.vector_equals(this._lastSelectedHex, localHex )) {

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

    _generateIcons() {

        this._iconObjs["poi-icon-normal"] = new L.Icon({
            iconUrl: iconPoiNormalUrl,
            interactive: false,
            iconSize: [32, 32],
            className: "wm-poi-icon"
        });

        this._iconObjs["poi-icon-normal-small"] = new L.Icon({
            iconUrl: iconPoiNormalUrl,
            interactive: false,
            iconSize: [20, 20],
        });

        this._iconObjs["poi-icon-question"] = new L.Icon({
            iconUrl: iconPoiQuestionUrl,
            interactive: false,
            iconSize: [32, 32],
            className: "wm-poi-icon"
        });

        this._iconObjs["poi-icon-question-small"] = new L.Icon({
            iconUrl: iconPoiQuestionUrl,
            interactive: false,
            iconSize: [20, 20],
        });

    }

    // Generate a single marker for a 'town'
    _generateTownMarker ( latlng, label, imgUrl ) {
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

    // Create all of our point-of-interest markers
    _addPoiMarkers( ) {
        let that = this;

        let townLayerElems = [];
        let poiLayerElems = [];

        this._mapData.features.forEach(element => {

            if ( element.type === "town" ) {
                let latlng = leaflet_utils.pixel_to_latlng(this.localHexToPixel(element.loc));
                let marker = this._generateTownMarker(latlng, element.label, "/icon_town.png");
                townLayerElems.push(marker);
            }

            else if ( element.type === "poi" ) {

                let markerData = {};

                // Get the right SVG icon - give markers tagged 'approx' a little question mark
                if ( element.approx ) {
                    markerData.svgName = "poi-icon-question";
                }
                else {
                    markerData.svgName = "poi-icon-normal";
                }

                let latlng = leaflet_utils.pixel_to_latlng(this.localHexToPixel(element.loc));

                markerData.marker = L.marker(latlng, {
                    icon: that._iconObjs[markerData.svgName],
                    interactive: false
                });

                poiLayerElems.push(markerData.marker);
                this._poiMarkers.push(markerData);
            }
        });


        this._townLayerGroup = L.layerGroup(townLayerElems).addTo(this._map);
        this._poiLayerGroup = L.layerGroup(poiLayerElems).addTo(this._map);
    }

    // Generate our 'explored tile' overlay
    _addExploredTileOverlay( ) {
        this._exploredTileLayerGroup = this._createHexLayerGroup( this._mapData.exploredHexes, {
            color: "red",
            stroke: false,
            fillOpacity: 0.6
        });
    }
}