'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Coffee, Utensils, Store, Building, Plus, Search, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then((mod) => mod.Polygon), { ssr: false });

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


const categories = [
  { id: 'musea', label: 'Museos', toggleLabel: 'Museos', icon: Building, description: 'Explora la rica cultura local', color: '#E2A74F', textColor: '#FFF1DD' },
  { id: 'restaurant', label: 'Restaurantes', toggleLabel: 'Restaurantes', icon: Utensils, description: 'Sabores auténticos de Oaxaca', color: '#759E82', textColor: '#EBFCE5' },
  { id: 'design shops', label: 'Tiendas de diseño', toggleLabel: 'Tiendas', icon: Store, description: 'Diseño local y artesanías', color: '#D66F50', textColor: '#FFDEDE' },
  { id: 'cafe', label: 'Cafés', toggleLabel: 'Cafés', icon: Coffee, description: 'Cafeterías acogedoras', color: '#313E6D', textColor: '#E9E8FF' },
];

const neighborhoods = [
  { id: 'jalatlaco', name: 'Jalatlaco', color: '#FFA07A' },
  { id: 'xochimilco', name: 'Xochimilco', color: '#98FB98' },
  { id: 'centro-historico', name: 'Centro Histórico', color: '#87CEFA' },
];

// Dummy coordinates for neighborhoods (replace with actual coordinates)
const neighborhoodCoordinates = {
  'jalatlaco': [[17.065, -96.725], [17.070, -96.720], [17.068, -96.715]],
  'xochimilco': [[17.075, -96.730], [17.080, -96.725], [17.078, -96.720]],
  'centro-historico': [[17.060, -96.730], [17.065, -96.725], [17.063, -96.720]],
};

export default function OaxacaMap() {
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeNeighborhoods, setActiveNeighborhoods] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [hoveredPlace, setHoveredPlace] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [places, setPlaces] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/oaxaca.json')
      .then(response => response.json())
      .then(data => {
        const processedPlaces = {};
        data.forEach(item => {
          if (!processedPlaces[item.query]) {
            processedPlaces[item.query] = [];
          }
          item.data.places.forEach((place, index) => {
            processedPlaces[item.query].push({
              id: `${item.query}-${index}-${place.displayName.text}`,
              name: place.displayName.text,
              rating: place.rating,
              review: `${place.userRatingCount} reviews`,
              reviewer: "Google",
              lat: place.location.latitude,
              lng: place.location.longitude,
              url: place.googleMapsUri,
              neighborhood: item.location // Add neighborhood information
            });
          });
        });
        setPlaces(processedPlaces);
        setActiveFilters(Object.keys(processedPlaces));
        setActiveNeighborhoods(neighborhoods.map(n => n.id));
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredPlaces = useMemo(() => {
    const filtered = {};
    Object.entries(places).forEach(([category, categoryPlaces]) => {
      if (activeFilters.includes(category)) {
        filtered[category] = categoryPlaces.filter(place => 
          place.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          activeNeighborhoods.includes(place.neighborhood.toLowerCase().replace(' ', '-'))
        );
      }
    });
    return filtered;
  }, [places, activeFilters, activeNeighborhoods, searchTerm]);

  const toggleFilter = (categoryId) => {
    setActiveFilters(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleNeighborhood = (neighborhoodId) => {
    setActiveNeighborhoods(prev => 
      prev.includes(neighborhoodId) 
        ? prev.filter(id => id !== neighborhoodId)
        : [...prev, neighborhoodId]
    );
  };

  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="relative h-screen w-screen">
      <style jsx global>{`
        @font-face {
          font-family: 'Moranga';
          src: url('https://s3.amazonaws.com/webflow-prod-assets/64f079f8c0cbc83545a1c2e1/670983799c34f243d2b34f55_MorangaRegular.woff') format('woff');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'Moranga';
          src: url('https://s3.amazonaws.com/webflow-prod-assets/64f079f8c0cbc83545a1c2e1/67098379b1955ea664e70dd0_MorangeMedium.woff') format('woff');
          font-weight: 500;
          font-style: normal;
        }
        .leaflet-container {
          height: 100%;
          width: 100%;
        }
      `}</style>
      
      <MapContainer 
        center={[17.0654, -96.7236]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', backgroundColor: '#FFFBF5' }} 
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {neighborhoods.map((neighborhood) => (
          activeNeighborhoods.includes(neighborhood.id) && (
            <Polygon
              key={neighborhood.id}
              positions={neighborhoodCoordinates[neighborhood.id]}
              pathOptions={{ fillColor: neighborhood.color, fillOpacity: 0.2, weight: 2, color: neighborhood.color }}
            >
              <Popup>{neighborhood.name}</Popup>
            </Polygon>
          )
        ))}
        {Object.entries(filteredPlaces).flatMap(([categoryId, categoryPlaces]) =>
          categoryPlaces.map((place) => {
            const category = categories.find(c => c.id === categoryId);
            const Icon = category.icon;
            const iconSvg = Icon ? renderToStaticMarkup(<Icon className="w-8 h-8 text-white" />) : '';
            return (
              <Marker
                key={place.id}
                position={[place.lat, place.lng]}
                icon={L.divIcon({
                  html: `
                    <div style="background-color: ${category.color}; color: white; width: 24px; padding: 4px; height: 24px; display: flex; justify-content: center; align-items: center; border-radius: 50%;">
                      ${iconSvg}
                    </div>
                  `,
                  className: 'custom-icon',
                  iconSize: [30, 30],
                  iconAnchor: [15, 0],
                })}
              >
                <Popup>{place.name}</Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>
      
      <div className="absolute top-0 left-0 w-1/2 h-full overflow-y-auto p-20" style={{
        background: 'linear-gradient(90deg, rgba(255, 251, 245, 0.9) 0%, rgba(255, 251, 245, 0.8) 80%, rgba(255, 251, 245, 0) 100%)',
        zIndex: 1000
      }}>
        <div className="max-w-lg">
          <div className="mb-8">
            <p className="text-sm text-gray-600">OCTOBER 2024</p>
            <h1 className="text-6xl font-bold font-['Moranga'] text-[#1f2937]">Oaxaca</h1>
            <div className="flex items-center mt-2">
              <img src="/img/miguel.jpeg" alt="User" className="object-cover w-10 h-10 rounded-full mr-2" />
              <span className="text-sm text-gray-700">Miguel, José y Alejandro</span>
            </div>
          </div>

          <p className="mb-6 text-sm text-[#1f2937]">
            Descubre los tesoros ocultos de Oaxaca en 2024, anidados en callejones históricos
            y alejados de los puntos turísticos. Experimenta la auténtica cocina oaxaqueña y
            la vibrante cultura local en acogedores cafés y atracciones únicas favoritas de los residentes.
          </p>

          <div className="flex mb-6">
            <div className="relative flex-grow mr-2">
              <input
                type="text"
                placeholder="Buscar lugares"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button className="px-4 py-2 bg-[#1f2937] text-white rounded-md shadow text-sm font-medium">
              <Plus className="w-4 h-4 inline mr-1" />
              Añadir al mapa
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Barrios</h2>
            <div className="flex flex-wrap gap-2">
              {neighborhoods.map((neighborhood) => (
                <button
                  key={neighborhood.id}
                  className={`px-3 py-2 text-sm font-medium rounded-md border ${
                    activeNeighborhoods.includes(neighborhood.id)
                      ? 'bg-[#1f2937] text-white border-[#1f2937]'
                      : 'bg-white text-[#1f2937] border-[#1f2937]'
                  }`}
                  onClick={() => toggleNeighborhood(neighborhood.id)}
                >
                  {neighborhood.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-3 py-2 text-sm font-medium rounded-md border ${
                  activeFilters.includes(category.id)
                    ? 'bg-[#1f2937] text-white border-[#1f2937]'
                    : 'bg-white text-[#1f2937] border-[#1f2937]'
                }`}
                onClick={() => toggleFilter(category.id)}
              >
                {category.toggleLabel}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {categories.filter(category => activeFilters.includes(category.id)).map((category) => (
              <div
                key={category.id}
                className="rounded-lg overflow-hidden shadow"
                style={{ backgroundColor: category.color }}
              >
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <category.icon className="w-8 h-8 text-white mr-2" />
                    <h2 className="text-lg font-['Moranga'] font-medium text-white">
                      {filteredPlaces[category.id]?.length || 0} {category.label}
                    </h2>
                  </div>
                  <p className="text-xs mb-4" style={{ color: category.textColor }}>{category.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredPlaces[category.id] && filteredPlaces[category.id]
                      .slice(0, expandedCategories[category.id] ? undefined : 4)
                      .map((place) => (
                        <a 
                          key={place.id} 
                          href={place.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`bg-white bg-opacity-10 rounded p-2 transition-all duration-200 ${
                            hoveredPlace === `${category.id}-${place.id}` ? 'transform  scale-105' : ''
                          }`}
                          onMouseEnter={() => setHoveredPlace(`${category.id}-${place.id}`)}
                          onMouseLeave={() => setHoveredPlace(null)}
                          style={{ color: category.textColor }}
                        >
                          <h3 className="text-sm font-semibold">{place.name}</h3>
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-300 text-xs">★ {place.rating}</span>
                            <span className="ml-2 text-xs">{place.review}</span>
                          </div>
                          <div className="text-xs mt-1">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {place.neighborhood}
                          </div>
                        </a>
                      ))}
                  </div>
                  {filteredPlaces[category.id] && filteredPlaces[category.id].length > 4 && (
                    <button 
                      onClick={() => toggleExpand(category.id)} 
                      className="text-xs hover:underline mt-2"
                      style={{ color: category.textColor }}
                    >
                      {expandedCategories[category.id] ? 'Mostrar menos' : `Mostrar ${filteredPlaces[category.id].length - 4} más`}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}