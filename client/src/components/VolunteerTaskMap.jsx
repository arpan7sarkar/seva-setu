import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Maximize2, X, Navigation as NavIcon, Map as MapIcon, Target, Compass, Zap } from 'lucide-react';

// Custom Task Marker (Red / Disaster Icon)
const taskIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom Premium Google-Maps-Style Volunteer Marker
const RotatingVolunteerMarker = ({ position, heading }) => {
  const [rotation, setRotation] = useState(heading || 0);

  useEffect(() => {
    if (heading !== null && heading !== undefined) {
      setRotation(heading);
    }
  }, [heading]);

  // Create a high-fidelity SVG icon inspired by Google Maps
  const volunteerDivIcon = L.divIcon({
    className: 'premium-volunteer-marker',
    html: `
      <div class="marker-container" style="transform: rotate(${rotation}deg);">
        <!-- Heading Beam (The light cone) -->
        <div class="heading-beam"></div>
        
        <!-- Outer Pulse Ring -->
        <div class="pulse-ring"></div>
        
        <!-- The Core Marker -->
        <div class="marker-core">
          <div class="marker-white-border">
             <div class="marker-blue-center"></div>
          </div>
        </div>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 30]
  });

  return (
    <Marker position={[position.lat, position.lng]} icon={volunteerDivIcon}>
      <Popup>
        <div className="text-xs font-bold text-slate-800">Volunteer Position</div>
        <div className="text-[10px] text-slate-500">Live Navigation Active</div>
      </Popup>
    </Marker>
  );
};

const MapBoundsHandler = ({ volunteerCoords, taskCoords, isFullscreen }) => {
  const map = useMap();
  const prevCoords = useRef(null);

  useEffect(() => {
    if (volunteerCoords && taskCoords) {
      const bounds = L.latLngBounds(
        [volunteerCoords.lat, volunteerCoords.lng],
        [taskCoords.lat, taskCoords.lng]
      );
      
      if (!prevCoords.current) {
        map.fitBounds(bounds, { padding: [80, 80], animate: true });
      } else if (isFullscreen) {
        // Smoothly follow the volunteer in fullscreen
        map.panTo([volunteerCoords.lat, volunteerCoords.lng], { animate: true });
      }
      prevCoords.current = volunteerCoords;
    }
  }, [volunteerCoords.lat, volunteerCoords.lng, taskCoords.lat, taskCoords.lng, map, isFullscreen]);

  return null;
};

const VolunteerTaskMap = ({ volunteerCoords, taskCoords }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [distance, setDistance] = useState(null);
  const [calculatedHeading, setCalculatedHeading] = useState(0);
  const lastPos = useRef(null);

  // Manual Heading Fallback Calculation
  useEffect(() => {
    if (!volunteerCoords) return;
    
    if (volunteerCoords.heading !== null && volunteerCoords.heading !== undefined) {
      setCalculatedHeading(volunteerCoords.heading);
    } else if (lastPos.current) {
      const y = Math.sin(volunteerCoords.lng - lastPos.current.lng) * Math.cos(volunteerCoords.lat);
      const x = Math.cos(lastPos.current.lat) * Math.sin(volunteerCoords.lat) -
                Math.sin(lastPos.current.lat) * Math.cos(volunteerCoords.lat) * Math.cos(volunteerCoords.lng - lastPos.current.lng);
      const brng = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      if (Math.abs(volunteerCoords.lat - lastPos.current.lat) > 0.00001) {
        setCalculatedHeading(brng);
      }
    }
    lastPos.current = volunteerCoords;
  }, [volunteerCoords]);

  // Fetch route
  useEffect(() => {
    if (!volunteerCoords || !taskCoords) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${volunteerCoords.lng},${volunteerCoords.lat};${taskCoords.lng},${taskCoords.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRoutePoints(coords);
          setDistance((data.routes[0].distance / 1000).toFixed(2));
        }
      } catch (err) {
        setRoutePoints([[volunteerCoords.lat, volunteerCoords.lng], [taskCoords.lat, taskCoords.lng]]);
      }
    };

    fetchRoute();
  }, [volunteerCoords.lat, volunteerCoords.lng, taskCoords.lat, taskCoords.lng]);

  if (!volunteerCoords || !taskCoords) return null;

  const renderMap = (isFull) => (
    <MapContainer 
      center={[volunteerCoords.lat, volunteerCoords.lng]} 
      zoom={isFull ? 18 : 14} 
      scrollWheelZoom={isFull}
      zoomControl={isFull}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <RotatingVolunteerMarker position={volunteerCoords} heading={calculatedHeading} />

      <Marker position={[taskCoords.lat, taskCoords.lng]} icon={taskIcon}>
        <Popup>Incident Site</Popup>
      </Marker>

      {routePoints.length > 0 && (
        <Polyline 
          positions={routePoints} 
          color="#3b82f6" 
          weight={isFull ? 8 : 4} 
          opacity={0.7}
          lineJoin="round"
          dashArray={isFull ? null : "10, 10"}
        />
      )}

      <MapBoundsHandler volunteerCoords={volunteerCoords} taskCoords={taskCoords} isFullscreen={isFull} />
    </MapContainer>
  );

  return (
    <>
      <div 
        className="mt-4 rounded-3xl overflow-hidden border border-white/10 bg-slate-900 relative shadow-2xl cursor-pointer group hover:border-blue-500/50 transition-all"
        onClick={() => setIsFullscreen(true)}
      >
        <div className="absolute top-4 left-4 z-[500] bg-black/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 text-[11px] font-bold text-white shadow-lg flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
          {distance ? `Live Path: ${distance} km` : 'Real-time Navigation'}
        </div>
        
        <div className="absolute inset-0 z-10 bg-transparent" />

        <div className="absolute bottom-4 right-4 z-[500] p-2.5 bg-blue-500/20 backdrop-blur-md rounded-xl border border-blue-500/30 text-blue-400">
          <Maximize2 className="w-5 h-5" />
        </div>

        <div className="w-full h-72 pointer-events-none">
          {renderMap(false)}
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <header className="p-5 bg-slate-900 border-b border-white/10 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsFullscreen(false)} className="p-3 hover:bg-white/10 rounded-2xl text-slate-400 transition-colors">
                <X className="w-7 h-7" />
              </button>
              <div>
                <h3 className="text-white font-black text-lg flex items-center gap-2 tracking-tight">
                  <Compass className="w-5 h-5 text-blue-400 animate-spin-slow" />
                  Mission Pilot
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-blue-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]" />
                    High-Precision GPS
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Target: {distance || '--'} km</span>
                </div>
              </div>
            </div>
          </header>
          
          <div className="flex-1 relative">
            {renderMap(true)}
            
            <div className="absolute bottom-10 left-10 right-10 z-[1000] pointer-events-none">
               <div className="bg-black/95 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                        <NavIcon className="w-8 h-8 text-blue-400 fill-blue-400/10" />
                     </div>
                     <div>
                        <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest opacity-60">Route Navigation</p>
                        <p className="text-xl text-white font-black tracking-tight">{distance ? `${distance} km` : 'Locating...'} to target</p>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Live Tracking</p>
                     </div>
                     <p className="text-xs text-slate-400 font-bold text-right">Following Active Device</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }

        .premium-volunteer-marker {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .marker-container {
          position: relative;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .heading-beam {
          position: absolute;
          width: 0;
          height: 0;
          border-left: 20px solid transparent;
          border-right: 20px solid transparent;
          border-bottom: 50px solid rgba(59, 130, 246, 0.4);
          filter: blur(8px);
          top: -25px;
          transform-origin: center bottom;
        }

        .pulse-ring {
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.4);
          animation: marker-pulse 2s infinite;
        }

        @keyframes marker-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(3.5); opacity: 0; }
        }

        .marker-core {
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 2;
        }

        .marker-white-border {
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .marker-blue-center {
          width: 14px;
          height: 14px;
          background: #3b82f6;
          border-radius: 50%;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </>
  );
};

export default VolunteerTaskMap;
