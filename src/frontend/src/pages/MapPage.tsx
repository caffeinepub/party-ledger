import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMapLocationData } from '../hooks/queries/useMapLocationData';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2, MapPin, AlertCircle, RefreshCw, Calendar, X, Search, Filter, Map } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { dateToTime, dateToDatetimeLocal } from '../lib/time';

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
  const markerClusterGroupRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [markerClusterLoaded, setMarkerClusterLoaded] = useState(false);
  const [leafletError, setLeafletError] = useState(false);

  // Get today's date in datetime-local format
  const getTodayDatetimeLocal = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateToDatetimeLocal(today);
  };

  // Pending date state (what user is typing/selecting)
  const [pendingStartDate, setPendingStartDate] = useState<string>(getTodayDatetimeLocal());
  const [pendingEndDate, setPendingEndDate] = useState<string>(getTodayDatetimeLocal());

  // Active filter state (what's actually applied to the map)
  const [startDate, setStartDate] = useState<string>(getTodayDatetimeLocal());
  const [endDate, setEndDate] = useState<string>(getTodayDatetimeLocal());

  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  // Convert date strings to Time (bigint) for backend
  const startTime = startDate ? dateToTime(new Date(startDate)) : null;
  const endTime = endDate ? dateToTime(new Date(endDate)) : null;

  const { data: locationData, isLoading, error, refetch, isFetching } = useMapLocationData(startTime, endTime);

  // Log authentication and data state
  useEffect(() => {
    console.log('[MapPage] State:', {
      isAuthenticated,
      principal: identity?.getPrincipal().toString(),
      isLoading,
      isFetching,
      hasError: !!error,
      locationDataCount: locationData?.length || 0,
      startDate,
      endDate,
    });
  }, [isAuthenticated, identity, isLoading, isFetching, error, locationData, startDate, endDate]);

  // Load Leaflet and MarkerCluster from CDN
  useEffect(() => {
    // Check if already loaded
    if (window.L && window.L.markerClusterGroup) {
      setLeafletLoaded(true);
      setMarkerClusterLoaded(true);
      return;
    }

    // Load Leaflet first
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    leafletScript.crossOrigin = '';
    leafletScript.onload = () => {
      setLeafletLoaded(true);

      // Load MarkerCluster after Leaflet
      const markerClusterScript = document.createElement('script');
      markerClusterScript.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
      markerClusterScript.onload = () => setMarkerClusterLoaded(true);
      markerClusterScript.onerror = () => setLeafletError(true);
      document.head.appendChild(markerClusterScript);
    };
    leafletScript.onerror = () => setLeafletError(true);
    document.head.appendChild(leafletScript);

    return () => {
      // Cleanup is handled by the browser
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !markerClusterLoaded || !mapRef.current || mapInstanceRef.current) return;

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
  }, [leafletLoaded, markerClusterLoaded]);

  // Memoize marker data to prevent unnecessary re-renders
  const markerData = useMemo(() => {
    if (!locationData) return [];
    return locationData.map((location) => ({
      key: `${location.partyId}-${location.visitCount}`,
      ...location,
    }));
  }, [locationData]);

  // Add markers with clustering
  useEffect(() => {
    if (!leafletLoaded || !markerClusterLoaded || !mapInstanceRef.current || markerData.length === 0) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Remove existing marker cluster group
    if (markerClusterGroupRef.current) {
      map.removeLayer(markerClusterGroupRef.current);
      markerClusterGroupRef.current = null;
    }

    // Create marker cluster group with optimized settings
    const markers = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      chunkInterval: 200,
      chunkDelay: 50,
    });

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

    // Add markers to cluster group with enhanced popup information
    markerData.forEach((location) => {
      const marker = L.marker([location.latitude, location.longitude], { icon: customIcon });

      // Lazy load popup content with advanced details
      marker.on('click', () => {
        const popupContent = `
          <div style="min-width: 220px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${location.partyName}</h3>
            <p style="margin: 4px 0; font-size: 13px; color: #666;">${location.address}</p>
            <div style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px;">
              <p style="margin: 2px 0; font-size: 13px;"><strong>Total Visits:</strong> ${location.visitCount}</p>
              <p style="margin: 2px 0; font-size: 12px; color: #666;">Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</p>
            </div>
            <button 
              id="view-party-${location.partyId}" 
              style="
                margin-top: 8px;
                padding: 8px 12px;
                background-color: oklch(0.55 0.15 250);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                width: 100%;
                font-weight: 500;
              "
            >
              View Full Party Details
            </button>
          </div>
        `;

        marker.bindPopup(popupContent).openPopup();

        // Add click handler for the button after popup opens
        setTimeout(() => {
          const button = document.getElementById(`view-party-${location.partyId}`);
          if (button) {
            button.onclick = () => {
              navigate({ to: `/parties/${location.partyId}` });
            };
          }
        }, 100);
      });

      markers.addLayer(marker);
      bounds.push([location.latitude, location.longitude]);
    });

    // Add cluster group to map
    map.addLayer(markers);
    markerClusterGroupRef.current = markers;

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [leafletLoaded, markerClusterLoaded, markerData, navigate]);

  const handleSearch = () => {
    setStartDate(pendingStartDate);
    setEndDate(pendingEndDate);
  };

  const handleClearFilters = () => {
    const today = getTodayDatetimeLocal();
    setPendingStartDate(today);
    setPendingEndDate(today);
    setStartDate(today);
    setEndDate(today);
  };

  const hasActiveFilters = startDate || endDate;

  // Format date range display
  const dateRangeDisplay = useMemo(() => {
    if (!startDate && !endDate) return 'All dates';
    
    const formatDisplayDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    if (startDate && endDate) {
      if (startDate === endDate) {
        return formatDisplayDate(startDate);
      }
      return `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`;
    } else if (startDate) {
      return `From ${formatDisplayDate(startDate)}`;
    } else {
      return `Until ${formatDisplayDate(endDate)}`;
    }
  }, [startDate, endDate]);

  if (leafletError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load map library. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to view the map.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !leafletLoaded || !markerClusterLoaded) {
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
                <p className="text-muted-foreground">Loading advanced map view...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    console.error('[MapPage] Error displaying:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {error instanceof Error
                ? error.message === 'Authentication required to view map data'
                  ? 'Please log in to view map data.'
                  : `Failed to load location data: ${error.message}`
                : 'Failed to load location data. Please try again later.'}
            </span>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!locationData || locationData.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Advanced Visit Map
                </CardTitle>
                <CardDescription>
                  {hasActiveFilters 
                    ? 'No party visits with location data found for the selected date range'
                    : 'No party visits with location data found'}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                <Filter className="h-3 w-3 mr-1" />
                Advanced View
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Advanced Date Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={pendingStartDate}
                  onChange={(e) => setPendingStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={pendingEndDate}
                  onChange={(e) => setPendingEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            <p className="text-muted-foreground">
              {hasActiveFilters 
                ? 'Try adjusting the date range or clearing filters to see more results.'
                : 'Start recording party visits with location data to see them on the map.'}
            </p>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Advanced Visit Map
              </CardTitle>
              <CardDescription>
                {dateRangeDisplay} • {locationData.length} {locationData.length === 1 ? 'location' : 'locations'} with recorded visits
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Filter className="h-3 w-3 mr-1" />
                Advanced View
              </Badge>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Advanced Date Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={pendingStartDate}
                onChange={(e) => setPendingStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={pendingEndDate}
                onChange={(e) => setPendingEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Map Container */}
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
