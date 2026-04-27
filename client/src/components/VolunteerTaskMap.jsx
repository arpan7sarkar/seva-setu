/* VolunteerTaskMap.jsx - FINAL SMOOTHED VERSION */
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Maximize2, X, Zap } from 'lucide-react';

const toRad = (deg) => (deg * Math.PI) / 180;
const haversineKm = (a, b) => {
  if (!a || !b || a.lat === undefined || b.lat === undefined || b.lat === null || a.lat === null) return 0;
  const R = 6371;
  const dLat = toRad(Number(b.lat) - Number(a.lat));
  const dLon = toRad(Number(b.lng) - Number(a.lng));
  const h = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(toRad(Number(a.lat))) * Math.cos(toRad(Number(b.lat)));
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
};

const taskIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const RotatingVolunteerMarker = ({ position, heading }) => {
  const volunteerDivIcon = useMemo(() => L.divIcon({
    className: 'premium-volunteer-marker',
    html: `<div class="marker-container" style="transform: rotate(${heading || 0}deg);">
             <div class="heading-beam"></div>
             <div class="pulse-ring"></div>
             <div class="marker-core"><div class="marker-blue-center"></div></div>
           </div>`,
    iconSize: [40, 40], iconAnchor: [20, 20]
  }), [heading]);
  return <Marker position={[position.lat, position.lng]} icon={volunteerDivIcon} />;
};

const MapBoundsHandler = ({ volunteerCoords, taskCoords, isFullscreen }) => {
  const map = useMap();
  const hasCentered = useRef(false);
  useEffect(() => {
    if (volunteerCoords && taskCoords) {
      if (!hasCentered.current) {
        const bounds = L.latLngBounds([volunteerCoords.lat, volunteerCoords.lng], [taskCoords.lat, taskCoords.lng]);
        map.fitBounds(bounds, { padding: [50, 50] });
        hasCentered.current = true;
      } else if (isFullscreen) {
        map.panTo([volunteerCoords.lat, volunteerCoords.lng], { animate: true });
      }
    }
  }, [volunteerCoords, taskCoords, map, isFullscreen]);
  return null;
};

const VolunteerTaskMap = ({ volunteerCoords, taskCoords }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [heading, setHeading] = useState(0);
  const [displayDistance, setDisplayDistance] = useState("--");
  
  const lastValidPos = useRef(null);
  const smoothedDist = useRef(null);
  const osrmTimeout = useRef(null);

  // 1. DISTANCE SMOOTHING (Low-Pass Filter)
  useEffect(() => {
    if (!volunteerCoords || !taskCoords) return;
    const raw = haversineKm(volunteerCoords, taskCoords);
    
    if (smoothedDist.current === null) {
      smoothedDist.current = raw;
    } else {
      // Ignore impossible jumps > 5km
      if (Math.abs(raw - smoothedDist.current) > 5) return;
      // Weighted average: 80% old, 20% new
      smoothedDist.current = (smoothedDist.current * 0.8) + (raw * 0.2);
    }
    setDisplayDistance(smoothedDist.current.toFixed(2));
  }, [volunteerCoords, taskCoords]);

  // 2. HEADING CALCULATION
  useEffect(() => {
    if (!volunteerCoords) return;
    if (volunteerCoords.heading !== null && volunteerCoords.heading !== undefined) {
      setHeading(volunteerCoords.heading);
    } else if (lastValidPos.current) {
      const d = haversineKm(volunteerCoords, lastValidPos.current);
      if (d > 0.005) {
        const dLng = toRad(volunteerCoords.lng - lastValidPos.current.lng);
        const y = Math.sin(dLng) * Math.cos(toRad(volunteerCoords.lat));
        const x = Math.cos(toRad(lastValidPos.current.lat)) * Math.sin(toRad(volunteerCoords.lat)) -
                  Math.sin(toRad(lastValidPos.current.lat)) * Math.cos(toRad(volunteerCoords.lat)) * Math.cos(dLng);
        setHeading((Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
      }
    }
    lastValidPos.current = volunteerCoords;
  }, [volunteerCoords]);

  // 3. ROUTE FETCHING
  const fetchRoute = useCallback(async () => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${volunteerCoords.lng},${volunteerCoords.lat};${taskCoords.lng},${taskCoords.lat}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.code === 'Ok') setRoutePoints(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
    } catch {
      setRoutePoints([[volunteerCoords.lat, volunteerCoords.lng], [taskCoords.lat, taskCoords.lng]]);
    }
  }, [volunteerCoords, taskCoords]);

  useEffect(() => {
    if (osrmTimeout.current) clearTimeout(osrmTimeout.current);
    osrmTimeout.current = setTimeout(fetchRoute, 2500);
    return () => clearTimeout(osrmTimeout.current);
  }, [volunteerCoords, fetchRoute]);

  const renderMapContent = (isFull) => (
    <MapContainer 
      center={[volunteerCoords.lat, volunteerCoords.lng]} 
      zoom={isFull ? 17 : 14} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <RotatingVolunteerMarker position={volunteerCoords} heading={heading} />
      <Marker position={[taskCoords.lat, taskCoords.lng]} icon={taskIcon} />
      {routePoints.length > 0 && <Polyline positions={routePoints} color="#3b82f6" weight={isFull ? 6 : 4} opacity={0.6} />}
      <MapBoundsHandler volunteerCoords={volunteerCoords} taskCoords={taskCoords} isFullscreen={isFull} />
    </MapContainer>
  );

  if (!volunteerCoords || !taskCoords) return <div className="h-64 bg-slate-800 animate-pulse rounded-3xl" />;

  return (
    <>
      <div 
        className="mt-4 rounded-3xl overflow-hidden bg-slate-900 relative shadow-xl group cursor-pointer" 
        style={{ height: '300px' }}
      >
        {/* Floating Distance Badge */}
        <div className="absolute top-4 left-4 z-[500] bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold text-white border border-white/10 flex items-center gap-2 pointer-events-none">
          <Zap className="w-3 h-3 text-blue-400" /> {displayDistance} km
        </div>

        {/* Floating Maximize Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(true);
          }}
          className="absolute top-4 right-4 z-[500] bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md p-3 rounded-2xl border-2 border-[#4ade80]/50 hover:border-[#4ade80] transition-all transform hover:scale-110 shadow-2xl active:scale-95 group/max"
          title="Fullscreen Map"
        >
          <Maximize2 className="w-5 h-5 text-[#4ade80] group-hover/max:text-[#22c55e] transition-colors" />
        </button>

        {/* Map content is now only for viewing/panning in minimap mode */}
        <div className="w-full h-full">
          {renderMapContent(false)}
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col animate-in fade-in zoom-in duration-300">
          <header className="p-4 bg-slate-900 flex items-center justify-between border-b border-white/5">
            <button onClick={() => setIsFullscreen(false)} className="text-white hover:bg-white/10 p-2 rounded-xl transition-colors"><X /></button>
            <span className="text-white font-bold">{displayDistance} km to target</span>
            <div className="w-6" />
          </header>
          <div className="flex-1">{renderMapContent(true)}</div>
        </div>
      )}

      <style>{`.premium-volunteer-marker{display:flex;align-items:center;justify-content:center}.marker-container{position:relative;width:40px;height:40px;transition:transform 0.5s ease-out}.heading-beam{position:absolute;width:0;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-bottom:40px solid rgba(59,130,246,0.3);filter:blur(4px);top:-20px;left:5px;}.pulse-ring{position:absolute;width:20px;height:20px;left:10px;top:10px;border-radius:50%;background:rgba(59,130,246,0.3);animation:marker-pulse 2s infinite}.marker-core{width:16px;height:16px;position:absolute;left:12px;top:12px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)}.marker-blue-center{width:10px;height:10px;background:#3b82f6;border-radius:50%}@keyframes marker-pulse{0%{transform:scale(1);opacity:1}100%{transform:scale(3);opacity:0}}`}</style>
    </>
  );
};

export default VolunteerTaskMap;