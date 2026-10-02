/**
 * CLIMASCOPE — Location Map Component
 * ======================================
 * Leaflet map for picking a location.
 */

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Crosshair } from 'lucide-react';
import type { GeoLocation } from '../../api/types';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Component that handles map clicks */
const MapClickHandler: React.FC<{
  onSelect: (loc: GeoLocation) => void;
  onError: (message: string | null) => void;
}> = ({ onSelect, onError }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      onError(null);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
        );
        if (!res.ok) throw new Error(`Location lookup failed (${res.status}).`);
        const data = await res.json();
        const label =
          data.display_name?.split(',').slice(0, 3).join(',') ||
          `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
        onSelect({ lat, lng, label });
      } catch (error) {
        onSelect({ lat, lng, label: `${lat.toFixed(3)}, ${lng.toFixed(3)}` });
        onError(
          error instanceof Error ? error.message : 'Could not look up the place name.'
        );
      }
    },
  });
  return null;
};

/** Component that flies to a position */
const FlyTo: React.FC<{ position: [number, number] | null }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 11, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
};

interface LocationMapProps {
  value: GeoLocation | null;
  onChange: (loc: GeoLocation) => void;
}

export const LocationMap: React.FC<LocationMapProps> = ({ value, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=1&accept-language=en`
      );
      if (!res.ok) throw new Error(`Location search failed (${res.status}).`);
      const results = await res.json();
      if (results.length > 0) {
        const r = results[0];
        onChange({
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          label: r.display_name?.split(',').slice(0, 3).join(',') || searchQuery,
        });
      } else {
        setSearchError('No matching location was found. Try a nearby city or region.');
      }
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : 'Could not search for that location.'
      );
    } finally {
      setSearching(false);
    }
  };

  const position: [number, number] | null = value
    ? [value.lat, value.lng]
    : null;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div role="search" aria-label="Search for a place" className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSearch();
              }
            }}
            placeholder="Search location (e.g., Mumbai, India)"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
            aria-label="Search for a location"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={searching}
          className="px-4 py-2.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
        >
          {searching ? '...' : 'Search'}
        </button>
      </div>
      {searchError && (
        <p className="text-xs text-red-400" role="alert">
          {searchError}
        </p>
      )}

      {/* Map */}
      <div className="h-64 rounded-xl overflow-hidden border border-white/5">
        <MapContainer
          center={position || [20.5937, 78.9629]} // Default: India center
          zoom={position ? 11 : 5}
          className="h-full w-full"
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler onSelect={onChange} onError={setSearchError} />
          <FlyTo position={position} />
          {position && <Marker position={position} icon={defaultIcon} />}
        </MapContainer>
      </div>

      {/* Selected location */}
      {value && (
        <div className="flex items-center gap-2 text-xs text-white/50">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span className="truncate">{value.label}</span>
          <span className="text-white/20 font-mono">
            ({value.lat.toFixed(4)}, {value.lng.toFixed(4)})
          </span>
        </div>
      )}

      {!value && (
        <p className="text-xs text-white/30 flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5" />
          Click on the map or search to select a location
        </p>
      )}
    </div>
  );
};
