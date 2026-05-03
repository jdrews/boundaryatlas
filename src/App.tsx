import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Sun, Moon, Globe, Info } from 'lucide-react';

const App: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Country colors for 7-color map
  const countryColors = {
    light: [
      '#fecaca', '#bbf7d0', '#bfdbfe', '#fef08a', '#ddd6fe', '#fed7aa', '#e2e8f0'
    ],
    dark: [
      '#7f1d1d', '#14532d', '#1e3a8a', '#713f12', '#4c1d95', '#7c2d12', '#1f2937'
    ]
  };

  useEffect(() => {
    if (map.current) return;

    console.log('Initializing map with theme:', theme);
    document.documentElement.setAttribute('data-theme', theme);

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': theme === 'dark' ? '#0b0e14' : '#e0f2f1'
            }
          }
        ]
      },
      center: [0, 20],
      zoom: 1.5,
      attributionControl: false
    });

    map.current.on('load', () => {
      console.log('Map load event fired');
      if (!map.current) return;

      // Use absolute paths from root for Vite/GitHub Pages compatibility
      const baseUrl = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL;
      const countriesPath = `${baseUrl}/data/countries.json`.replace(/\/+/g, '/');
      const citiesPath = `${baseUrl}/data/cities.json`.replace(/\/+/g, '/');

      console.log('Loading countries from:', countriesPath);
      console.log('Loading cities from:', citiesPath);

      map.current.addSource('countries', {
        type: 'geojson',
        data: countriesPath,
        generateId: true
      });

      map.current.addSource('cities', {
        type: 'geojson',
        data: citiesPath
      });

      // Country Fill
      map.current.addLayer({
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': [
            'match',
            ['get', 'MAPCOLOR7'],
            1, countryColors[theme][0],
            2, countryColors[theme][1],
            3, countryColors[theme][2],
            4, countryColors[theme][3],
            5, countryColors[theme][4],
            6, countryColors[theme][5],
            7, countryColors[theme][6],
            '#cccccc'
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.7
          ]
        }
      });

      // Country Borders
      map.current.addLayer({
        id: 'countries-border',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': theme === 'dark' ? '#ffffff' : '#000000',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            2,
            0.5
          ],
          'line-opacity': 0.3
        }
      });

      // City Points
      map.current.addLayer({
        id: 'cities-point',
        type: 'circle',
        source: 'cities',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            1, ['match', ['get', 'ADM0CAP'], 1, 3, 2],
            5, ['match', ['get', 'ADM0CAP'], 1, 6, 4]
          ],
          'circle-color': theme === 'dark' ? '#ffffff' : '#000000',
          'circle-stroke-width': 1,
          'circle-stroke-color': theme === 'dark' ? '#000000' : '#ffffff'
        }
      });

      // City Labels
      map.current.addLayer({
        id: 'cities-label',
        type: 'symbol',
        source: 'cities',
        layout: {
          'text-field': ['get', 'NAME'],
          'text-font': ['Noto Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            2, 9,
            6, 14
          ],
          'text-offset': [0, 0.8],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': theme === 'dark' ? '#ffffff' : '#000000',
          'text-halo-color': theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
          'text-halo-width': 1.5
        },
        filter: ['all', 
          ['>=', ['zoom'], 2],
          ['any', 
            ['==', ['get', 'ADM0CAP'], 1],
            ['>=', ['zoom'], 4]
          ]
        ]
      });

      // Interaction: Hover effect
      let hoveredStateId: string | number | null = null;

      map.current.on('mousemove', 'countries-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredStateId !== null) {
            map.current?.setFeatureState(
              { source: 'countries', id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = e.features[0].id ?? null;
          if (hoveredStateId !== null) {
            map.current?.setFeatureState(
              { source: 'countries', id: hoveredStateId },
              { hover: true }
            );
          }
          map.current!.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'countries-fill', () => {
        if (hoveredStateId !== null) {
          map.current?.setFeatureState(
            { source: 'countries', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
        map.current!.getCanvas().style.cursor = '';
      });

      console.log('Layers added successfully');
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update theme
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    document.documentElement.setAttribute('data-theme', theme);
    const colors = countryColors[theme];
    
    map.current.setPaintProperty('background', 'background-color', theme === 'dark' ? '#0b0e14' : '#e0f2f1');
    
    if (map.current.getLayer('countries-fill')) {
      map.current.setPaintProperty('countries-fill', 'fill-color', [
        'match',
        ['get', 'MAPCOLOR7'],
        1, colors[0],
        2, colors[1],
        3, colors[2],
        4, colors[3],
        5, colors[4],
        6, colors[5],
        7, colors[6],
        '#cccccc'
      ]);
    }
    
    if (map.current.getLayer('countries-border')) {
      map.current.setPaintProperty('countries-border', 'line-color', theme === 'dark' ? '#ffffff' : '#000000');
    }
    
    if (map.current.getLayer('cities-point')) {
      map.current.setPaintProperty('cities-point', 'circle-color', theme === 'dark' ? '#ffffff' : '#000000');
      map.current.setPaintProperty('cities-point', 'circle-stroke-color', theme === 'dark' ? '#000000' : '#ffffff');
    }
    
    if (map.current.getLayer('cities-label')) {
      map.current.setPaintProperty('cities-label', 'text-color', theme === 'dark' ? '#ffffff' : '#000000');
      map.current.setPaintProperty('cities-label', 'text-halo-color', theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className="app-container">
      <div className="ui-overlay">
        <div className="glass-panel title-panel">
          <h1>BoundaryAtlas</h1>
          <p>Global Geopolitical Explorer</p>
        </div>
        
        <div className="glass-panel controls-panel">
          <button className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="icon-btn" title="About">
            <Info size={20} />
          </button>
        </div>
      </div>

      <div className="glass-panel legend-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={14} />
          <span>Natural Earth 1:110m Data</span>
        </div>
      </div>

      <div id="map-container" ref={mapContainer} />
    </div>
  );
};

export default App;
