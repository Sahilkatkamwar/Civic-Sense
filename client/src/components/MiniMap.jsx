// client/src/components/MiniMap.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPriorityConfig, getCategoryConfig } from '../utils/civicHelpers';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function MiniMap({ complaints = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const defaultLat = complaints.length > 0 && complaints[0].latitude ? complaints[0].latitude : 19.0760;
    const defaultLng = complaints.length > 0 && complaints[0].longitude ? complaints[0].longitude : 72.8777;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: false
      }).setView([defaultLat, defaultLng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing marker layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const validMarkers = [];
    complaints.forEach((c) => {
      if (c.latitude && c.longitude) {
        const prio = getPriorityConfig(c.priority_level);
        const cat = getCategoryConfig(c.category_id);

        const iconHtml = `
          <div style="
            background: ${prio.color};
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            ${c.report_count > 1 ? c.report_count : '•'}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-minimap-pin',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([c.latitude, c.longitude], { icon: customIcon }).addTo(map);

        const popupContent = `
          <div style="font-family: var(--font-sans); font-size: 12px; line-height: 1.4; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="color: #0b2545; font-family: var(--font-mono);">${c.id}</strong>
              <span style="background: ${prio.bgColor}; color: ${prio.color}; padding: 1px 5px; border-radius: 4px; font-size: 10px; font-weight: 700;">
                ${prio.shortLabel}
              </span>
            </div>
            <div style="font-weight: 700; color: #0c1a30; margin-bottom: 2px;">${c.category_name || cat.name}</div>
            <div style="color: #52637a; font-size: 11px; margin-bottom: 6px;">${c.address_text || 'Nearby Coordinates'}</div>
            <a href="/track/${c.id}" style="color: #c2410c; font-weight: 700; text-decoration: none; font-size: 11px;">
              Inspect Track Record &rarr;
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
        validMarkers.push(marker);
      }
    });

    if (validMarkers.length > 1) {
      const group = new L.featureGroup(validMarkers);
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [complaints]);

  return (
    <div className="mini-map-root">
      <div ref={mapContainerRef} style={{ width: '100%', height: '380px' }} />
      <style>{`
        .mini-map-root {
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }
        .custom-minimap-pin {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
