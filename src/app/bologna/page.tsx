"use client"

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Coffee, Utensils, Store, Building, Plus, Search } from 'lucide-react'
import L from 'leaflet';

const categories = [
  { id: 'cafes', label: 'Local Cafés', toggleLabel: 'Cafés', icon: Coffee, count: 7, description: 'Enjoy a delicious €1 espresso', color: '#313E6D', textColor: '#E9E8FF' },
  { id: 'restaurants', label: 'Small restaurants', toggleLabel: 'Restaurants', icon: Utensils, count: 6, description: 'A Pasta Norma in the sun', color: '#759E82', textColor: '#EBFCE5' },
  { id: 'stores', label: 'Designy stores', toggleLabel: 'Stores', icon: Store, count: 12, description: 'No tourist bullshit', color: '#D66F50', textColor: '#FFDEDE' },
  { id: 'museums', label: 'Museums', toggleLabel: 'Museums', icon: Building, count: 13, description: "You've seen it first", color: '#E2A74F', textColor: '#FFF1DD' },
]

const places = {
  cafes: [
    { id: 1, name: "Uno Caffé Olistico", rating: 4.5, review: "615 reviews", reviewer: "Google", lat: 44.4974458, lng: 11.3462072, url: "https://goo.gl/maps/XYZ123" },
    { id: 2, name: "3rd Wave Espresso", rating: 4.7, review: "112 reviews", reviewer: "Google", lat: 44.4904434, lng: 11.3372101, url: "https://goo.gl/maps/ABC456" },
    { id: 3, name: "Coco café", rating: 4.5, review: "81 reviews", reviewer: "Google", lat: 44.4904618, lng: 11.3508895, url: "https://goo.gl/maps/DEF789" },
    { id: 4, name: "Noir Caffè Bistrot", rating: 4.6, review: "75 reviews", reviewer: "Google", lat: 44.4988305, lng: 11.3567556, url: "https://goo.gl/maps/GHI101" },
    { id: 5, name: "Caffetteria Del Portico", rating: 4.5, review: "426 reviews", reviewer: "Google", lat: 44.5012592, lng: 11.370042699999999, url: "https://goo.gl/maps/JKL112" },
    { id: 6, name: "Club Cafè (caffetteria gourmet)", rating: 4.5, review: "447 reviews", reviewer: "Google", lat: 44.440776299999996, lng: 11.3538903, url: "https://goo.gl/maps/MNO131" },
    { id: 7, name: "Bar Kinotto", rating: 4.3, review: "315 reviews", reviewer: "Google", lat: 44.4967142, lng: 11.3426211, url: "https://goo.gl/maps/PQR415" }
  ],
  restaurants: [
    { id: 1, name: "Trattoria da Me", rating: 4.5, review: "1,234 reviews", reviewer: "Google", lat: 44.4936, lng: 11.3476, url: "https://goo.gl/maps/STU161" },
    { id: 2, name: "Osteria dell'Orsa", rating: 4.4, review: "6,789 reviews", reviewer: "Google", lat: 44.4967, lng: 11.3466, url: "https://goo.gl/maps/VWX171" },
    { id: 3, name: "Sfoglia Rina", rating: 4.6, review: "2,345 reviews", reviewer: "Google", lat: 44.4944, lng: 11.3452, url: "https://goo.gl/maps/YZA181" },
    { id: 4, name: "Bottega Portici", rating: 4.3, review: "1,122 reviews", reviewer: "Google", lat: 44.4941, lng: 11.3435, url: "https://goo.gl/maps/BCD191" },
    { id: 5, name: "La Montanara", rating: 4.7, review: "567 reviews", reviewer: "Google", lat: 44.4889, lng: 11.3492, url: "https://goo.gl/maps/EFG201" },
    { id: 6, name: "Oltre", rating: 4.5, review: "890 reviews", reviewer: "Google", lat: 44.4998, lng: 11.3497, url: "https://goo.gl/maps/HIJ211" }
  ],
  stores: [
    { id: 1, name: "I Xii BO Original Design Shop", rating: 4.8, review: "32 reviews", reviewer: "Google", lat: 44.4956068, lng: 11.3467355, url: "https://goo.gl/maps/KLM221" },
    { id: 2, name: "DOODESIGN - Cartarredo Design S.R.L.", rating: 4.8, review: "12 reviews", reviewer: "Google", lat: 44.493353, lng: 11.3473478, url: "https://goo.gl/maps/NOP231" },
    { id: 3, name: "De Diseño", rating: 4.6, review: "13 reviews", reviewer: "Google", lat: 44.4912844, lng: 11.3409698, url: "https://goo.gl/maps/QRS241" },
    { id: 4, name: "Haus269- Independent Design Store", rating: 4.8, review: "20 reviews", reviewer: "Google", lat: 44.4897686, lng: 11.3407854, url: "https://goo.gl/maps/TUV251" },
    { id: 5, name: "Atelier Bologna", rating: 4.8, review: "49 reviews", reviewer: "Google", lat: 44.500996, lng: 11.3404998, url: "https://goo.gl/maps/WXY261" },
    { id: 6, name: "Urban Design Love Affair", rating: 5, review: "14 reviews", reviewer: "Google", lat: 44.487117, lng: 11.3483702, url: "https://goo.gl/maps/ZAB271" },
    { id: 7, name: "Guccini Arredamenti", rating: 4.5, review: "42 reviews", reviewer: "Google", lat: 44.4928123, lng: 11.300203999999999, url: "https://goo.gl/maps/CDE281" },
    { id: 8, name: "Studio Interior Design Berti Daniela s.r.l.", rating: 4.8, review: "42 reviews", reviewer: "Google", lat: 44.4889794, lng: 11.295845499999999, url: "https://goo.gl/maps/FGH291" },
    { id: 9, name: "Case & Design Di Carlo Venturi E C. S.A.S.", rating: 4.9, review: "10 reviews", reviewer: "Google", lat: 44.4736818, lng: 11.2740216, url: "https://goo.gl/maps/IJK301" },
    { id: 10, name: "Bottega7", rating: 4.9, review: "10 reviews", reviewer: "Google", lat: 44.0559085, lng: 12.180648, url: "https://goo.gl/maps/LMN311" },
    { id: 11, name: "Atelier Domus Design - Showroom Cucine Milano", rating: 4.6, review: "29 reviews", reviewer: "Google", lat: 45.4488279, lng: 9.198932, url: "https://goo.gl/maps/OPQ321" },
    { id: 12, name: "Linearredo", rating: 4.7, review: "46 reviews", reviewer: "Google", lat: 45.544562899999995, lng: 9.1144377, url: "https://goo.gl/maps/RST331" },
  ],
  museums: [
    { id: 1, name: "Collezioni Comunali d'Arte", rating: 4.5, review: "253 reviews", reviewer: "Google", lat: 44.4939611, lng: 11.342407099999999, url: "https://goo.gl/maps/UVW341" },
    { id: 2, name: "International Museum and Library of Music", rating: 4.5, review: "1050 reviews", reviewer: "Google", lat: 44.492847399999995, lng: 11.3502958, url: "https://goo.gl/maps/XYZ351" },
    { id: 3, name: "Museo Davia Bargellini", rating: 4.5, review: "555 reviews", reviewer: "Google", lat: 44.492289, lng: 11.3519455, url: "https://goo.gl/maps/ABC361" },
    { id: 4, name: "Museo di Palazzo Poggi", rating: 4.7, review: "432 reviews", reviewer: "Google", lat: 44.4968777, lng: 11.3524089, url: "https://goo.gl/maps/DEF371" },
    { id: 5, name: "Industrial Heritage Museum", rating: 4.6, review: "743 reviews", reviewer: "Google", lat: 44.5215949, lng: 11.3348696, url: "https://goo.gl/maps/GHI381" },
    { id: 6, name: "Museum of Prehistory \"Luigi Donini\"", rating: 4.5, review: "639 reviews", reviewer: "Google", lat: 44.4697683, lng: 11.400403899999999, url: "https://goo.gl/maps/JKL391" },
    { id: 7, name: "Villa Griffone", rating: 4.8, review: "178 reviews", reviewer: "Google", lat: 44.4313976, lng: 11.2675705, url: "https://goo.gl/maps/MNO401" },
    { id: 8, name: "Museo di Arti e Mestieri - Pietro Lazzarini", rating: 4.5, review: "138 reviews", reviewer: "Google", lat: 44.3924544, lng: 11.350243299999999, url: "https://goo.gl/maps/PQR411" },
    { id: 9, name: "National Etruscan Museum", rating: 4.5, review: "419 reviews", reviewer: "Google", lat: 44.336908699999995, lng: 11.203871999999999, url: "https://goo.gl/maps/STU421" },
    { id: 10, name: "Gipsoteca Vitali", rating: 4.5, review: "87 reviews", reviewer: "Google", lat: 44.723102499999996, lng: 11.283666600000002, url: "https://goo.gl/maps/VWX431" },
    { id: 11, name: "Museo della Civiltà contadina e Piccolo Museo dell'Emigrante", rating: 4.7, review: "14 reviews", reviewer: "Google", lat: 44.2037032, lng: 11.316077199999999, url: "https://goo.gl/maps/YZA441" },
    { id: 12, name: "Palazzo Milzetti - Museo Nazionale dell'età neoclassica in Romagna", rating: 4.7, review: "501 reviews", reviewer: "Google", lat: 44.285259599999996, lng: 11.8784347, url: "https://goo.gl/maps/BCD451" },
    { id: 13, name: "Musei Civici di Reggio Emilia", rating: 4.5, review: "1121 reviews", reviewer: "Google", lat: 44.7001734, lng: 10.6320902, url: "https://goo.gl/maps/EFG461" },
  ],
}

const CustomMarker = ({ categoryId, place, isHovered, setHoveredPlace }) => {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      const icon = L.divIcon({
        className: 'custom-icon',
        html: `
          <svg width="24" height="33" viewBox="0 0 24 33" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37257 0 0 5.31965 0 11.8818C0 18.6137 7.54971 28.5503 10.6731 32.3711C11.3589 33.2096 12.6411 33.2096 13.3269 32.3711C16.4503 28.5503 24 18.6137 24 11.8818C24 5.31965 18.6274 0 12 0Z" fill="${categories.find(c => c.id === categoryId).color}"/>
          </svg>
        `,
        iconSize: [24, 33],
        iconAnchor: [12, 33],
      });
      markerRef.current.setIcon(icon);
    }
  }, [categoryId]);

  useEffect(() => {
    if (markerRef.current) {
      if (isHovered) {
        markerRef.current.getElement().style.transform = 'scale(1.2)';
        markerRef.current.getElement().style.zIndex = 1000;
      } else {
        markerRef.current.getElement().style.transform = 'scale(1)';
        markerRef.current.getElement().style.zIndex = 'auto';
      }
    }
  }, [isHovered]);

  return (
    <Marker 
      position={[place.lat, place.lng]} 
      ref={markerRef}
      eventHandlers={{
        mouseover: () => setHoveredPlace(`${categoryId}-${place.id}`),
        mouseout: () => setHoveredPlace(null),
      }}
    >
      <Popup>{place.name}</Popup>
    </Marker>
  );
};

export default function Component() {
  const [activeFilters, setActiveFilters] = useState(categories.map(c => c.id))
  const [expandedCategories, setExpandedCategories] = useState({})
  const [hoveredPlace, setHoveredPlace] = useState(null)
  const  [searchTerm, setSearchTerm] = useState("")

  const toggleFilter = (categoryId) => {
    setActiveFilters(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

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
      `}</style>
      <MapContainer className="z-0" center={[44.4949, 11.3426]} zoom={13} style={{ height: '100%', width: '100%', backgroundColor: '#FFFBF5' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {Object.entries(places).flatMap(([categoryId, categoryPlaces]) =>
          activeFilters.includes(categoryId) && categoryPlaces.map((place) => (
            <CustomMarker
              key={`${categoryId}-${place.id}`}
              categoryId={categoryId}
              place={place}
              isHovered={hoveredPlace === `${categoryId}-${place.id}`}
              setHoveredPlace={setHoveredPlace}
            />
          ))
        )}
      </MapContainer>
      
      <div className="absolute top-0 left-0 w-1/2 h-full overflow-y-auto p-20 z-20" style={{
        background: 'linear-gradient(90deg, rgba(255, 251, 245, 0.9) 0%, rgba(255, 251, 245, 0.8) 80%, rgba(255, 251, 245, 0) 100%)'
      }}>
        <div className="max-w-lg">
          
          <div className="mb-8">
            <p className="text-sm text-gray-600">MARCH 2024</p>
            <h1 className="text-6xl font-bold font-['Moranga'] text-[#1f2937]">Bologna</h1>
            <div className="flex items-center mt-2">
              <img src="/placeholder.svg?height=40&width=40" alt="User" className="w-10 h-10 rounded-full mr-2" />
              <span className="text-sm text-gray-700">Miguel, José en Allejandro</span>
            </div>
          </div>

          <p className="mb-6 text-sm text-[#1f2937]">
            Uncover Bologna's hidden treasures in 2024, nestled in historic
            alleys and tucked away from tourist hotspots. Experience
            authentic Bolognese cuisine and vibrant local culture in cozy
            cafes and unique attractions favored by residents.
          </p>

          <div className="flex mb-6">
            <div className="relative flex-grow mr-2">
              <input
                type="text"
                placeholder="Record stores"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button className="px-4 py-2 bg-[#1f2937] text-white rounded-md shadow text-sm font-medium">
              <Plus className="w-4 h-4 inline mr-1" />
              Add to map
            </button>
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
                      {category.count} {category.label}
                    </h2>
                  </div>
                  <p className="text-xs mb-4" style={{ color: category.textColor }}>{category.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {places[category.id] && places[category.id]
                      .slice(0, expandedCategories[category.id] ? undefined : 4)
                      .map((place) => (
                        <a 
                          key={place.id} 
                          href={place.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`bg-white bg-opacity-10 rounded p-2 transition-all duration-200 ${
                            hoveredPlace === `${category.id}-${place.id}` ? 'transform scale-105' : ''
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
                        </a>
                      ))}
                  </div>
                  {places[category.id] && places[category.id].length > 4 && (
                    <button 
                      onClick={() => toggleExpand(category.id)} 
                      className="text-xs hover:underline mt-2"
                      style={{ color: category.textColor }}
                    >
                      {expandedCategories[category.id] ? 'Show less' : `Show ${places[category.id].length - 4} more`}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  )
}