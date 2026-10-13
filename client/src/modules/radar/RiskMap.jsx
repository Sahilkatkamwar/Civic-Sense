// client/src/modules/radar/RiskMap.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const LEVEL_COLORS = {
  critical: {
    stroke: '#dc2626',
    fill: '#dc2626',
    badgeBg: '#991b1b',
    label: 'CRITICAL'
  },
  high: {
    stroke: '#ea580c',
    fill: '#ea580c',
    badgeBg: '#c2410c',
    label: 'HIGH'
  },
  medium: {
    stroke: '#d97706',
    fill: '#d97706',
    badgeBg: '#b45309',
    label: 'MEDIUM'
  },
  low: {
    stroke: '#16a34a',
    fill: '#16a34a',
    badgeBg: '#15803d',
    label: 'LOW'
  }
};

export default function RiskMap({ clusters = [], selectedCluster = null, onSelectCluster }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter = [19.0760, 72.8777];
      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: true
      }).setView(defaultCenter, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const bounds = [];

    clusters.forEach((cluster) => {
      const { center, radius, level, score, categoryIcon, id } = cluster;
      const isSelected = selectedCluster && selectedCluster.id === id;
      const config = LEVEL_COLORS[level] || LEVEL_COLORS.medium;

      bounds.push([center.lat, center.lng]);

      // Circle representing cluster radius and impact zone
      const circle = L.circle([center.lat, center.lng], {
        radius: Math.max(radius, 40),
        color: config.stroke,
        weight: isSelected ? 3.5 : 2,
        fillColor: config.fill,
        fillOpacity: isSelected ? 0.35 : 0.2
      });

      circle.on('click', () => {
        onSelectCluster(cluster);
      });

      circle.addTo(layerGroup);

      // DivIcon displaying Level Text and Score (NOT color-only)
      const badgeHtml = `
        <div style="
          background: ${config.badgeBg};
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 999px;
          font-family: var(--font-sans, sans-serif);
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          border: ${isSelected ? '2.5px solid #ffffff' : '1.5px solid #ffffff'};
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transform: translate(-50%, -50%);
          white-space: nowrap;
        ">
          <span>${categoryIcon || '📍'}</span>
          <span>${config.label}</span>
          <span style="opacity: 0.9; font-weight: 500;">(${score}/100)</span>
        </div>
      `;

      const marker = L.marker([center.lat, center.lng], {
        icon: L.divIcon({
          html: badgeHtml,
          className: 'cs-radar-leaflet-badge',
          iconSize: [0, 0]
        })
      });

      marker.on('click', () => {
        onSelectCluster(cluster);
      });

      marker.addTo(layerGroup);
    });

    if (bounds.length > 0) {
      if (selectedCluster) {
        map.setView([selectedCluster.center.lat, selectedCluster.center.lng], 15, { animate: true });
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [clusters, selectedCluster, onSelectCluster]);

  return (
    <div className="cs-radar-map-card">
      <div ref={mapContainerRef} className="cs-radar-map-container" />
    </div>
  );
}
