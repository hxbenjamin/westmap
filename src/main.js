// main.js

import './style.css'

import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet';

import map_data from '../static/map_data.json'
import mapUrl from '../static/shipfall.png'

import * as west_map from './west_map.js'


let infoPane = new west_map.WestMapInfoPane( document.getElementById( "westmap-panel" ) );
let westMap = new west_map.WestMap( map_data, mapUrl, infoPane );