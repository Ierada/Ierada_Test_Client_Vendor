import React, { useEffect, useRef, useState } from "react";
import { X, MapPin, Search } from "lucide-react";
import {
  englishLocationError,
  pickEnglishGeocodeResult,
} from "../../../utils/englishLocation";

const LocationMapModal = ({ isOpen, onClose, onSave }) => {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  
  const [currentAddress, setCurrentAddress] = useState("Locating...");
  const [selectedLatLng, setSelectedLatLng] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState(null);

  const apiKey = import.meta.env.VITE_GMAP_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY || "AIzaSyDummyKeyForTesting";

  useEffect(() => {
    if (!isOpen) return;
    
    // Check if script is already loaded and window.google is ready
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    if (!apiKey) {
      setCurrentAddress("Error: Google Maps API key is missing");
      return;
    }

    // Check if Google Maps script is already in the DOM (loading or loaded)
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      existingScript.addEventListener("load", initMap, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=en&region=IN`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {
      /* keep Maps script loaded so later opens still work */
    };
  }, [isOpen, apiKey]);

  const initMap = () => {
    if (!mapRef.current) return;
    
    try {
      const google = window.google;

      // Default center (India)
      const defaultLocation = { lat: 20.5937, lng: 78.9629 };

      const map = new google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: 5,
        disableDefaultUI: true,
        zoomControl: true,
      });

      const newMarker = new google.maps.Marker({
        position: defaultLocation,
        map,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });

      // Setup Search Autocomplete
      if (searchInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
          componentRestrictions: { country: "in" },
          fields: ["geometry", "formatted_address", "address_components", "name"],
        });
        autocomplete.bindTo('bounds', map);

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) return;

          map.setCenter(place.geometry.location);
          map.setZoom(15);
          newMarker.setPosition(place.geometry.location);
          handleLocationChange(place.geometry.location.lat(), place.geometry.location.lng());
        });
      }

      // Drag event
      newMarker.addListener('dragend', () => {
        const pos = newMarker.getPosition();
        if (pos) {
          handleLocationChange(pos.lat(), pos.lng());
        }
      });

      // Click event
      map.addListener('click', (e) => {
        if (e.latLng) {
          newMarker.setPosition(e.latLng);
          map.panTo(e.latLng);
          handleLocationChange(e.latLng.lat(), e.latLng.lng());
        }
      });

      // Try HTML5 Geolocation to auto-center
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            map.setCenter(pos);
            map.setZoom(15);
            newMarker.setPosition(pos);
            handleLocationChange(pos.lat, pos.lng);
          },
          () => {
            setCurrentAddress("Allow location, or search the place in English");
          }
        );
      }
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
      setCurrentAddress("Error loading map. Please check your API key.");
    }
  };

  const handleLocationChange = async (lat, lng) => {
    setSelectedLatLng({ lat, lng });
    setIsGeocoding(true);
    setCurrentAddress("Fetching address...");

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=en&region=in`
      );
      const data = await response.json();
      const picked = pickEnglishGeocodeResult(data.results);
      const locErr = picked
        ? englishLocationError(picked.city, picked.state, picked.fullAddress)
        : "Could not capture this location in English. Search the place in English.";

      if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        setCurrentAddress("Could not fetch this address. Search the place in English.");
        setGeocodeResult(null);
        return;
      }

      if (!picked || locErr) {
        setCurrentAddress(locErr);
        setGeocodeResult(null);
        return;
      }

      setCurrentAddress(picked.fullAddress || [picked.city, picked.state].filter(Boolean).join(", "));
      setGeocodeResult({
        ...picked,
        address_components: [],
      });
    } catch (error) {
      setCurrentAddress(
        "Could not fetch this address. Search the place in English.",
      );
      setGeocodeResult(null);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSave = () => {
    if (!selectedLatLng || currentAddress === "Locating..." || currentAddress === "Fetching address...") return;
    if (!geocodeResult) return;

    const locErr = englishLocationError(
      geocodeResult.city,
      geocodeResult.state,
      geocodeResult.fullAddress || currentAddress,
    );
    if (locErr) {
      setCurrentAddress(locErr);
      return;
    }

    onSave({
      fullAddress: geocodeResult.fullAddress || currentAddress,
      lat: selectedLatLng.lat,
      lng: selectedLatLng.lng,
      street: geocodeResult.street || "",
      city: geocodeResult.city || "",
      state: geocodeResult.state || "",
      country: geocodeResult.country || "India",
      zipCode: geocodeResult.zipCode || "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh] max-h-[700px] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-white z-10 shrink-0">
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <MapPin className="text-orange-500" /> Select Pickup Location
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Search Input Layered over Map */}
        <div className="relative shrink-0 z-10 p-4 bg-white border-b border-neutral-100 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a city, area or landmark"
              className="w-full h-12 pl-12 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium text-sm text-neutral-900 placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 bg-neutral-100 min-h-0">
          <div ref={mapRef} className="absolute inset-0 w-full h-full" />
          
          {/* Instructions Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-neutral-200 pointer-events-none">
            <p className="text-xs font-semibold text-neutral-700">Drag the pin to set precise location</p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-5 bg-white border-t border-neutral-100 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-10">
          <div className="mb-4">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Selected Location</p>
            <p className="text-sm font-medium text-neutral-900 leading-tight">
              {currentAddress}
            </p>
          </div>
          
          <button 
            onClick={handleSave} 
            disabled={!selectedLatLng || isGeocoding || !geocodeResult}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {isGeocoding ? "Fetching Location..." : "Confirm Location"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationMapModal;