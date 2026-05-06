'use client';

import { MapPin } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onGeolocate: () => void;
  geolocating: boolean;
};

export function LocationInput({ value, onChange, onGeolocate, geolocating }: Props) {
  return (
    <div>
      <label
        htmlFor="location"
        className="block text-[13px] font-medium text-text-secondary tracking-[0.02em] mb-2"
      >
        Location
      </label>
      <div className="relative">
        <input
          id="location"
          type="text"
          value={geolocating ? 'Getting your location...' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Where are you?"
          disabled={geolocating}
          required
          className="w-full h-12 pl-4 pr-12 bg-surface border border-border rounded-lg
                     text-[15px] text-text-primary placeholder:text-text-tertiary
                     focus:outline-none focus:border-accent
                     transition-colors duration-150
                     disabled:text-text-secondary"
        />
        <button
          type="button"
          onClick={onGeolocate}
          disabled={geolocating}
          aria-label="Use my location"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2
                     text-text-tertiary hover:text-text-primary
                     transition-colors duration-150
                     disabled:cursor-not-allowed"
        >
          <MapPin size={18} className={geolocating ? 'animate-pulse' : ''} />
        </button>
      </div>
    </div>
  );
}
