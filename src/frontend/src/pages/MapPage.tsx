import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMapLocationData } from '../hooks/queries/useMapLocationData';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Leaflet types
declare global {
  interface Window {
    L: any;
  }
}

const MapPage = memo(function MapPage() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [leafletError, setLeafletError] = useState(false);

  const { data: locationData, isLoading, error } = useMapLocationData();

  // Load Leaflet from CDN
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => setLeafletLoaded(true);
    script.onerror = () => setLeafletError(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5); // Center of India

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Memoize marker data to prevent unnecessary re-renders
  const markerData = useMemo(() => {
    if (!locationData) return [];
    return locationData.map((location) => ({
      key: `${location.partyId}-${location.visitCount}`,
      ...location,
    }));
  }, [locationData]);

  // Add markers
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || markerData.length === 0) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Create custom icon (memoized outside the loop)
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const bounds: any[] = [];

    markerData.forEach((location) => {
      const marker = L.marker([location.latitude, location.longitude], { icon: customIcon }).addTo(map);

      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${location.partyName}</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #666;">${location.address}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Visits:</strong> ${location.visitCount}</p>
          <button 
            id="view-party-${location.partyId}" 
            style="
              margin-top: 8px;
              padding: 6px 12px;
              background-color: oklch(0.55 0.15 250);
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              width: 100%;
            "
          >
            View Party Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler for the button
      marker.on('popupopen', () => {
        const button = document.getElementById(`view-party-${location.partyId}`);
        if (button) {
          button.onclick = () => {
            navigate({ to: `/parties/${location.partyId}` });
          };
        }
      });

      markersRef.current.push(marker);
      bounds.push([location.latitude, location.longitude]);
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [leafletLoaded, markerData, navigate]);

  if (leafletError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load map library. Please check your internet connection and try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !leafletLoaded) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="w-full h-[600px] rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load location data. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!locationData || locationData.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Visit Map
            </CardTitle>
            <CardDescription>No party visits with location data found</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Start recording party visits with location data to see them on the map.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Visit Map
          </CardTitle>
          <CardDescription>
            Showing {locationData.length} {locationData.length === 1 ? 'location' : 'locations'} with recorded visits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={mapRef}
            className="w-full h-[600px] rounded-lg border border-border overflow-hidden"
            style={{ zIndex: 0 }}
          />
        </CardContent>
      </Card>
    </div>
  );
});

export default MapPage;
