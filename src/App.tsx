import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Sun, Moon, Globe, Info } from 'lucide-react';

const App: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Country colors for 7-color map
  const countryColors = {
    light: [
      '#fecaca', '#bbf7d0', '#bfdbfe', '#fef08a', '#ddd6fe', '#fed7aa', '#e2e8f0'
    ],
    dark: [
      '#450a0a', '#064e3b', '#1e3a8a', '#422006', '#2e1065', '#431407', '#0f172a'
    ]
  };

  useEffect(() => {
    if (map.current) return;

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

    // Initialize Tooltip Popup
    popup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'country-tooltip',
      offset: 15
    });

    map.current.on('load', () => {
      if (!map.current) return;

      const baseUrl = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL;
      const countriesPath = `${baseUrl}/data/countries.json`.replace(/\/+/g, '/');
      const countryLabelsPath = `${baseUrl}/data/country_labels.json`.replace(/\/+/g, '/');
      const citiesPath = `${baseUrl}/data/cities.json`.replace(/\/+/g, '/');

      map.current.addSource('countries', {
        type: 'geojson',
        data: countriesPath,
        generateId: true
      });

      map.current.addSource('country_labels', {
        type: 'geojson',
        data: countryLabelsPath
      });

      map.current.addSource('cities', {
        type: 'geojson',
        data: citiesPath
      });

      // 1. Country Fill
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

      // 2. Country Borders
      map.current.addLayer({
        id: 'countries-border',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': theme === 'dark' ? '#ffffff' : '#000000',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1.5,
            0.4
          ],
          'line-opacity': 0.2
        }
      });

      // 3. Country Labels (Using dedicated label points)
      map.current.addLayer({
        id: 'countries-label',
        type: 'symbol',
        source: 'country_labels',
        layout: {
          'text-field': ['get', 'NAME'],
          'text-font': ['Noto Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            1, 8,
            4, 14
          ],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.1,
          'text-allow-overlap': false
        },
        paint: {
          'text-color': theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
          'text-halo-color': theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
          'text-halo-width': 1
        }
      });

      // 4. Muted City Points
      map.current.addLayer({
        id: 'cities-point',
        type: 'circle',
        source: 'cities',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 1,
            6, 3
          ],
          'circle-color': theme === 'dark' ? '#ffffff' : '#000000',
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 0,
            4, 0.4
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          'circle-stroke-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 0,
            4, 0.4
          ]
        },
        filter: ['>=', ['zoom'], 3] // Hide completely at low zoom
      });

      // 5. City Labels
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
            4, 9,
            8, 12
          ],
          'text-offset': [0, 0.8],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
          'text-halo-color': theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
          'text-halo-width': 1,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 0,
            4, 1
          ]
        },
        filter: ['any',
          ['==', ['get', 'ADM0CAP'], 1], // Always show capitals if zoom > 3
          ['>=', ['zoom'], 5]            // Show others at higher zoom
        ]
      });

      // Hover Interaction
      let hoveredStateId: string | number | null = null;

      map.current.on('mousemove', 'countries-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const countryName = feature.properties?.NAME || 'Unknown';

          if (hoveredStateId !== null) {
            map.current?.setFeatureState({ source: 'countries', id: hoveredStateId }, { hover: false });
          }

          hoveredStateId = feature.id ?? null;

          if (hoveredStateId !== null) {
            map.current?.setFeatureState({ source: 'countries', id: hoveredStateId }, { hover: true });
          }

          // Tooltip Update
          if (popup.current && map.current) {
            popup.current
              .setLngLat(e.lngLat)
              .setHTML(`<div class="tooltip-content">${countryName}</div>`)
              .addTo(map.current);
          }

          map.current!.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'countries-fill', () => {
        if (hoveredStateId !== null) {
          map.current?.setFeatureState({ source: 'countries', id: hoveredStateId }, { hover: false });
        }
        hoveredStateId = null;

        if (popup.current) {
          popup.current.remove();
        }

        map.current!.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
      popup.current = null;
    };
  }, []);

  // Update theme properties
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

    if (map.current.getLayer('countries-label')) {
      map.current.setPaintProperty('countries-label', 'text-color', theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)');
    }

    if (map.current.getLayer('cities-point')) {
      map.current.setPaintProperty('cities-point', 'circle-color', theme === 'dark' ? '#ffffff' : '#000000');
    }

    if (map.current.getLayer('cities-label')) {
      map.current.setPaintProperty('cities-label', 'text-color', theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)');
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
          <span>Natural Earth 1:50m Data</span>
        </div>
      </div>

      <div id="map-container" ref={mapContainer} />
    </div>
  );
};

export default App;
