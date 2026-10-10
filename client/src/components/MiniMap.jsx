// client/src/components/MiniMap.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function MiniMap({ complaints = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center (Mumbai municipal area or first complaint coords)
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

    // Add marker for each complaint with valid coordinates
    const validMarkers = [];
    complaints.forEach((c) => {
      if (c.latitude && c.longitude) {
        // Custom emoji div icon
        const iconHtml = `
          <div style="
            background: #ffffff;
            border: 2px solid ${c.priority_level === 'critical' ? '#dc2626' : c.priority_level === 'high' ? '#ea580c' : '#2563eb'};
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            ${c.category_icon || '📌'}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-map-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([c.latitude, c.longitude], { icon: customIcon }).addTo(map);

        const popupContent = `
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 2px;">
            <strong style="color: #1e40af; font-family: monospace;">${c.id}</strong><br/>
            <strong>${c.category_name || c.category_id}</strong><br/>
            <span style="color: #64748b; font-size: 11px;">${c.address_text || 'Coordinates: ' + c.latitude + ', ' + c.longitude}</span><br/>
            <span style="display: inline-block; margin-top: 4px; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #eff6ff; color: #1e40af;">
              Priority: ${c.priority_level} (${c.priority_score})
            </span><br/>
            <a href="/track/${c.id}" style="color: #2563eb; display: inline-block; margin-top: 6px; font-weight: 600; text-decoration: none;">Track this &rarr;</a>
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
    <div className="mini-map-wrapper">
      <div ref={mapContainerRef} style={{ width: '100%', height: '360px', borderRadius: 'var(--radius-lg)' }} />
      <style>{`
        .mini-map-wrapper {
          position: relative;
          box-shadow: var(--shadow-md);
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .custom-map-pin {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}
