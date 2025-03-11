import './style.css'

import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet';

import map_data from '../public/map_data.json'
import mapUrl from '../public/shipfall.png'

import * as west_map from './west_map.js'

let westMap = new west_map.WestMap( map_data, mapUrl );