"use client";
import { useRef, useCallback, useState } from "react";
import Map, {
  Source,
  Layer,
  NavigationControl,
  FullscreenControl,
  Popup,
  MapRef,
  MapLayerMouseEvent,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { GeoJSON } from "geojson";
import { Listing } from "@/lib/types";
import ListingPopup from "../Listings/ListingPopup";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";

// NYC + JC centered
const INITIAL_VIEW = { longitude: -73.97, latitude: 40.73, zoom: 11 };

interface PopupInfo {
  longitude: number;
  latitude: number;
  listing: Listing;
}

interface Props {
  listings: Listing[];
  onListingClick: (l: Listing) => void;
}

function toGeoJSON(listings: Listing[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: listings.map((l) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [l.lon, l.lat] },
      properties: {
        id: l.id,
        price: l.price,
        bedrooms: l.bedrooms,
        neighborhood: l.neighborhood,
        borough: l.borough,
        address: l.address,
        sqft: l.sqft,
        transit_score: l.transit_score,
        walk_score: l.walk_score,
        images: JSON.stringify(l.images),
        amenities: JSON.stringify(l.amenities),
        description: l.description,
        listing_url: l.listing_url,
        available_date: l.available_date,
        source: l.source,
        title: l.title,
        is_active: l.is_active,
        created_at: l.created_at,
        city: l.city,
        state: l.state,
        zip_code: l.zip_code,
        bathrooms: l.bathrooms,
      },
    })),
  };
}

function featureToListing(props: Record<string, unknown>): Listing {
  return {
    ...(props as unknown as Listing),
    images: JSON.parse((props.images as string) || "[]"),
    amenities: JSON.parse((props.amenities as string) || "[]"),
  };
}

export default function MapView({ listings, onListingClick }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const geojson = toGeoJSON(listings);

  // Click handler for clusters and points
  const onClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const features = e.features;
      if (!features?.length) return;
      const feature = features[0];

      if (feature.layer?.id === "clusters") {
        const clusterId = feature.properties?.cluster_id as number;
        const mapboxSource = mapRef.current?.getSource("listings") as {
          getClusterExpansionZoom: (
            id: number,
            cb: (err: Error | null, zoom: number) => void
          ) => void;
        };
        if (!mapboxSource) return;
        mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
          mapRef.current?.easeTo({ center: coords, zoom: zoom + 0.5, duration: 400 });
        });
      } else if (feature.layer?.id === "unclustered-point") {
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        const listing = featureToListing(feature.properties as Record<string, unknown>);
        setPopupInfo({ longitude: coords[0], latitude: coords[1], listing });
      }
    },
    []
  );

  const onMouseEnter = useCallback(() => {
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "pointer";
  }, []);

  const onMouseLeave = useCallback(() => {
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "";
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <div className="text-center text-slate-500 max-w-sm">
          <div className="text-2xl mb-2">🗺️</div>
          <p className="font-medium mb-1">Mapbox token not set</p>
          <p className="text-sm">Add <code className="bg-slate-200 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN=pk....</code> to your <code>.env</code> file and restart the frontend.</p>
        </div>
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      initialViewState={INITIAL_VIEW}
      mapStyle={MAP_STYLE}
      mapboxAccessToken={MAPBOX_TOKEN}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      interactiveLayerIds={["clusters", "unclustered-point"]}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="bottom-right" />
      <FullscreenControl position="top-right" />

      <Source
        id="listings"
        type="geojson"
        data={geojson}
        cluster={true}
        clusterMaxZoom={14}
        clusterRadius={45}
      >
        {/* Cluster circles — sized + colored by count */}
        <Layer
          id="clusters"
          type="circle"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#3b82f6",
              10, "#2563eb",
              30, "#1d4ed8",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              22, 10, 30, 30, 38,
            ],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#fff",
            "circle-stroke-opacity": 0.8,
          }}
        />

        {/* Cluster count label */}
        <Layer
          id="cluster-count"
          type="symbol"
          filter={["has", "point_count"]}
          layout={{
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 13,
          }}
          paint={{ "text-color": "#ffffff" }}
        />

        {/* Individual listing dots — colored green→blue→red by price */}
        <Layer
          id="unclustered-point"
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "price"],
              1500, "#16a34a",
              2500, "#0ea5e9",
              3500, "#2563eb",
              5000, "#7c3aed",
              8000, "#dc2626",
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10, 6,
              14, 10,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9,
          }}
        />

        {/* Price label — shows at zoom 13+ */}
        <Layer
          id="unclustered-label"
          type="symbol"
          filter={["!", ["has", "point_count"]]}
          minzoom={13}
          layout={{
            "text-field": [
              "concat",
              "$",
              [
                "to-string",
                [
                  "/",
                  ["round", ["/", ["get", "price"], 100]],
                  10,
                ],
              ],
              "k",
            ],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 11,
            "text-offset": [0, 1.3],
            "text-anchor": "top",
          }}
          paint={{
            "text-color": "#1e293b",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.5,
          }}
        />
      </Source>

      {/* Popup on point click */}
      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          anchor="bottom"
          onClose={() => setPopupInfo(null)}
          closeButton={false}
          maxWidth="280px"
        >
          <ListingPopup
            listing={popupInfo.listing}
            onExpand={() => {
              setPopupInfo(null);
              onListingClick(popupInfo.listing);
            }}
          />
        </Popup>
      )}
    </Map>
  );
}
