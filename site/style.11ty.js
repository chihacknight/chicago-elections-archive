exports.data = {
  layout: null,
  permalink: "/style.json",
  eleventyExcludeFromCollections: true,
}

exports.render = ({ site }) => {
  const precinctSources = site.precinctYears.reduce(
    (acc, year) => ({
      ...acc,
      [`precincts-${year}`]: {
        type: 'geojson',
        data: `${process.env.GEOJSON_DOMAIN}/precincts-${year}.geojson`,
        maxzoom: 12,
        attribution:
          year == 1983
            ? '<a href="https://www.chicagoelectionsproject.com/" target="_blank">Chicago Elections Project</a>'
            : '<a href="https://chicagoelections.com/" target="_blank">Chicago Board of Election Commissioners</a>',
        promoteId: "id",
      },
    }),
    {}
  )

  return JSON.stringify({
    id: "positron",
    version: 8,
    name: "Positron",
    sources: {
      openmaptiles: {
        type: "vector",
        maxzoom: 14,
        tiles: [
          "https://midwest-openmaptiles.us-east-1.linodeobjects.com/{z}/{x}/{y}.pbf",
        ],
        attribution:
          '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
      },
      ...precinctSources,
    },
    sprite:
      "https://midwest-openmaptiles.us-east-1.linodeobjects.com/klokantech-basic/sprite",
    glyphs:
      "https://midwest-openmaptiles.us-east-1.linodeobjects.com/fonts/{fontstack}/{range}.pbf",
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "rgb(242,243,240)" },
      },
      {
        id: "park",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "park",
        filter: ["==", "$type", "Polygon"],
        layout: { visibility: "visible" },
        paint: { "fill-color": "rgb(230, 233, 229)" },
      },
      {
        id: "water",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "water",
        filter: [
          "all",
          ["==", "$type", "Polygon"],
          ["!=", "brunnel", "tunnel"],
        ],
        layout: { visibility: "visible" },
        paint: { "fill-antialias": true, "fill-color": "rgb(194, 200, 202)" },
      },
      {
        id: "landcover_ice_shelf",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        maxzoom: 8,
        filter: [
          "all",
          ["==", "$type", "Polygon"],
          ["==", "subclass", "ice_shelf"],
        ],
        layout: { visibility: "visible" },
        paint: { "fill-color": "hsl(0, 0%, 98%)", "fill-opacity": 0.7 },
      },
      {
        id: "landcover_glacier",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        maxzoom: 8,
        filter: [
          "all",
          ["==", "$type", "Polygon"],
          ["==", "subclass", "glacier"],
        ],
        layout: { visibility: "visible" },
        paint: {
          "fill-color": "hsl(0, 0%, 98%)",
          "fill-opacity": {
            base: 1,
            stops: [
              [0, 1],
              [8, 0.5],
            ],
          },
        },
      },
      {
        id: "landuse_residential",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landuse",
        maxzoom: 16,
        filter: [
          "all",
          ["==", "$type", "Polygon"],
          ["==", "class", "residential"],
        ],
        layout: { visibility: "visible" },
        paint: {
          "fill-color": "rgb(234, 234, 230)",
          "fill-opacity": {
            base: 0.6,
            stops: [
              [8, 0.8],
              [9, 0.6],
            ],
          },
        },
      },
      {
        id: "landcover_wood",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        minzoom: 10,
        filter: ["all", ["==", "$type", "Polygon"], ["==", "class", "wood"]],
        layout: { visibility: "visible" },
        paint: {
          "fill-color": "rgb(220,224,220)",
          "fill-opacity": {
            base: 1,
            stops: [
              [8, 0],
              [12, 1],
            ],
          },
        },
      },
      {
        id: "waterway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "waterway",
        filter: ["==", "$type", "LineString"],
        layout: { visibility: "visible" },
        paint: { "line-color": "hsl(195, 17%, 78%)" },
      },
      {
        id: "water_name",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "water_name",
        filter: ["==", "$type", "LineString"],
        layout: {
          "symbol-placement": "line",
          "symbol-spacing": 500,
          "text-field": "{name:latin}\n{name:nonlatin}",
          "text-font": ["Metropolis Medium Italic"],
          "text-rotation-alignment": "map",
          "text-size": 12,
        },
        paint: {
          "text-color": "rgb(157,169,177)",
          "text-halo-blur": 1,
          "text-halo-color": "rgb(242,243,240)",
          "text-halo-width": 1,
        },
      },
      {
        id: "building",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 12,
        paint: {
          "fill-antialias": true,
          "fill-color": "rgb(234, 234, 229)",
          "fill-outline-color": "rgb(219, 219, 218)",
        },
      },
      {
        id: "tunnel_motorway_casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 6,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["all", ["==", "brunnel", "tunnel"], ["==", "class", "motorway"]],
        ],
        layout: {
          "line-cap": "butt",
          "line-join": "miter",
          visibility: "visible",
        },
        paint: {
          "line-color": "rgb(213, 213, 213)",
          "line-opacity": 1,
          "line-width": {
            base: 1.4,
            stops: [
              [5.8, 0],
              [6, 3],
              [20, 40],
            ],
          },
        },
      },
      {
        id: "tunnel_motorway_inner",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 6,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["all", ["==", "brunnel", "tunnel"], ["==", "class", "motorway"]],
        ],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": "rgb(234,234,234)",
          "line-width": {
            base: 1.4,
            stops: [
              [4, 2],
              [6, 1.3],
              [20, 30],
            ],
          },
        },
      },
      {
        id: "aeroway-taxiway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "aeroway",
        minzoom: 12,
        filter: ["all", ["in", "class", "taxiway"]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": "hsl(0, 0%, 88%)",
          "line-opacity": 1,
          "line-width": {
            base: 1.55,
            stops: [
              [13, 1.8],
              [20, 20],
            ],
          },
        },
      },
      {
        id: "aeroway-runway-casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "aeroway",
        minzoom: 11,
        filter: ["all", ["in", "class", "runway"]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": "hsl(0, 0%, 88%)",
          "line-opacity": 1,
          "line-width": {
            base: 1.5,
            stops: [
              [11, 6],
              [17, 55],
            ],
          },
        },
      },
      {
        id: "aeroway-area",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "aeroway",
        minzoom: 4,
        filter: [
          "all",
          ["==", "$type", "Polygon"],
          ["in", "class", "runway", "taxiway"],
        ],
        layout: { visibility: "visible" },
        paint: {
          "fill-color": "rgba(255, 255, 255, 1)",
          "fill-opacity": {
            base: 1,
            stops: [
              [13, 0],
              [14, 1],
            ],
          },
        },
      },
      {
        id: "aeroway-runway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "aeroway",
        minzoom: 11,
        filter: [
          "all",
          ["in", "class", "runway"],
          ["==", "$type", "LineString"],
        ],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": "rgba(255, 255, 255, 1)",
          "line-opacity": 1,
          "line-width": {
            base: 1.5,
            stops: [
              [11, 4],
              [17, 50],
            ],
          },
        },
      },
      {
        id: "road_area_pier",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["all", ["==", "$type", "Polygon"], ["==", "class", "pier"]],
        layout: { visibility: "visible" },
        paint: { "fill-antialias": true, "fill-color": "rgb(242,243,240)" },
      },
      {
        id: "road_pier",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["all", ["==", "$type", "LineString"], ["in", "class", "pier"]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "rgb(242,243,240)",
          "line-width": {
            base: 1.2,
            stops: [
              [15, 1],
              [17, 4],
            ],
          },
        },
      },
      {
        id: "highway_path",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["all", ["==", "$type", "LineString"], ["==", "class", "path"]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": "rgb(234, 234, 234)",
          "line-opacity": 0.9,
          "line-width": {
            base: 1.2,
            stops: [
              [13, 1],
              [20, 10],
            ],
          },
        },
      },
      {
        id: "highway_minor",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 8,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["in", "class", "minor", "service", "track"],
        ],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": "hsl(0, 0%, 88%)",
          "line-opacity": 0.9,
          "line-width": {
            base: 1.55,
            stops: [
              [13, 1.8],
              [20, 20],
            ],
          },
        },
      },
      {
        id: "highway_major_casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 11,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["in", "class", "primary", "secondary", "tertiary", "trunk"],
        ],
        layout: {
          "line-cap": "butt",
          "line-join": "miter",
          visibility: "visible",
        },
        paint: {
          "line-color": "rgb(213, 213, 213)",
          "line-dasharray": [12, 0],
          "line-width": {
            base: 1.3,
            stops: [
              [10, 3],
              [20, 23],
            ],
          },
        },
      },
      {
        id: "highway_major_inner",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 11,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["in", "class", "primary", "secondary", "tertiary", "trunk"],
        ],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": "#fff",
          "line-width": {
            base: 1.3,
            stops: [
              [10, 2],
              [20, 20],
            ],
          },
        },
      },
      {
        id: "highway_major_subtle",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        maxzoom: 11,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["in", "class", "primary", "secondary", "tertiary", "trunk"],
        ],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: { "line-color": "hsla(0, 0%, 85%, 0.69)", "line-width": 2 },
      },
      {
        id: "highway_motorway_casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 6,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          [
            "all",
            ["!in", "brunnel", "bridge", "tunnel"],
            ["==", "class", "motorway"],
          ],
        ],
        layout: {
          "line-cap": "butt",
          "line-join": "miter",
          visibility: "visible",
        },
        paint: {
          "line-color": "rgb(213, 213, 213)",
          "line-dasharray": [2, 0],
          "line-opacity": 1,
          "line-width": {
            base: 1.4,
            stops: [
              [5.8, 0],
              [6, 3],
              [20, 40],
            ],
          },
        },
      },
      {
        id: "highway_motorway_inner",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 6,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          [
            "all",
            ["!in", "brunnel", "bridge", "tunnel"],
            ["==", "class", "motorway"],
          ],
        ],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": {
            base: 1,
            stops: [
              [5.8, "hsla(0, 0%, 85%, 0.53)"],
              [6, "#fff"],
            ],
          },
          "line-width": {
            base: 1.4,
            stops: [
              [4, 2],
              [6, 1.3],
              [20, 30],
            ],
          },
        },
      },
      {
        id: "highway_motorway_subtle",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        maxzoom: 6,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["==", "class", "motorway"],
        ],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": "hsla(0, 0%, 85%, 0.53)",
          "line-width": {
            base: 1.4,
            stops: [
              [4, 2],
              [6, 1.3],
            ],
          },
        },
      },
      {
        id: "railway_transit",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 16,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["all", ["==", "class", "transit"], ["!in", "brunnel", "tunnel"]],
        ],
        layout: { "line-join": "round", visibility: "visible" },
        paint: { "line-color": "#dddddd", "line-width": 3 },
      },
      {
        id: "railway_transit_dashline",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 16,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["all", ["==", "class", "transit"], ["!in", "brunnel", "tunnel"]],
        ],
        layout: { "line-join": "round", visibility: "visible" },
        paint: {
          "line-color": "#fafafa",
          "line-dasharray": [3, 3],
          "line-width": 2,
        },
      },
      {
        id: "railway_service",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 16,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["all", ["==", "class", "rail"], ["has", "service"]],
        ],
        layout: { "line-join": "round", visibility: "visible" },
        paint: { "line-color": "#dddddd", "line-width": 3 },
      },
      {
        id: "railway_service_dashline",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 16,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["==", "class", "rail"],
          ["has", "service"],
        ],
        layout: { "line-join": "round", visibility: "visible" },
        paint: {
          "line-color": "#fafafa",
          "line-dasharray": [3, 3],
          "line-width": 2,
        },
      },
      {
        id: "railway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 13,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["all", ["!has", "service"], ["==", "class", "rail"]],
        ],
        layout: { "line-join": "round", visibility: "visible" },
        paint: {
          "line-color": "#dddddd",
          "line-width": {
            base: 1.3,
            stops: [
              [16, 3],
              [20, 7],
            ],
          },
        },
      },
      {
        id: "railway_dashline",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 13,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["all", ["!has", "service"], ["==", "class", "rail"]],
        ],
        layout: { "line-join": "round", visibility: "visible" },
        paint: {
          "line-color": "#fafafa",
          "line-dasharray": [3, 3],
          "line-width": {
            base: 1.3,
            stops: [
              [16, 2],
              [20, 6],
            ],
          },
        },
      },
      {
        id: "highway_motorway_bridge_casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 6,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["all", ["==", "brunnel", "bridge"], ["==", "class", "motorway"]],
        ],
        layout: {
          "line-cap": "butt",
          "line-join": "miter",
          visibility: "visible",
        },
        paint: {
          "line-color": "rgb(213, 213, 213)",
          "line-dasharray": [2, 0],
          "line-opacity": 1,
          "line-width": {
            base: 1.4,
            stops: [
              [5.8, 0],
              [6, 5],
              [20, 45],
            ],
          },
        },
      },
      {
        id: "highway_motorway_bridge_inner",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 6,
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["all", ["==", "brunnel", "bridge"], ["==", "class", "motorway"]],
        ],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": {
            base: 1,
            stops: [
              [5.8, "hsla(0, 0%, 85%, 0.53)"],
              [6, "#fff"],
            ],
          },
          "line-width": {
            base: 1.4,
            stops: [
              [4, 2],
              [6, 1.3],
              [20, 30],
            ],
          },
        },
      },
      {
        id: "highway_name_other",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "transportation_name",
        filter: [
          "all",
          ["!=", "class", "motorway"],
          ["==", "$type", "LineString"],
        ],
        layout: {
          "symbol-placement": "line",
          "symbol-spacing": 350,
          "text-field": "{name:latin} {name:nonlatin}",
          "text-font": ["Metropolis Regular"],
          "text-max-angle": 30,
          "text-pitch-alignment": "viewport",
          "text-rotation-alignment": "map",
          "text-size": 10,
          "text-transform": "uppercase",
          visibility: "visible",
        },
        paint: {
          "text-color": "#bbb",
          "text-halo-blur": 1,
          "text-halo-color": "#fff",
          "text-halo-width": 2,
          "text-translate": [0, 0],
        },
      },
      {
        id: "highway_name_motorway",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "transportation_name",
        filter: [
          "all",
          ["==", "$type", "LineString"],
          ["==", "class", "motorway"],
        ],
        layout: {
          "symbol-placement": "line",
          "symbol-spacing": 350,
          "text-field": "{ref}",
          "text-font": ["Metropolis Light"],
          "text-pitch-alignment": "viewport",
          "text-rotation-alignment": "viewport",
          "text-size": 10,
          visibility: "visible",
        },
        paint: {
          "text-color": "rgb(117, 129, 145)",
          "text-halo-blur": 1,
          "text-halo-color": "hsl(0, 0%, 100%)",
          "text-halo-width": 1,
          "text-translate": [0, 2],
        },
      },
      {
        id: "boundary_state",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        filter: ["==", "admin_level", 4],
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        paint: {
          "line-blur": 0.4,
          "line-color": "rgb(230, 204, 207)",
          "line-dasharray": [2, 2],
          "line-opacity": 1,
          "line-width": {
            base: 1.3,
            stops: [
              [3, 1],
              [22, 15],
            ],
          },
        },
      },
      {
        id: "boundary_country_z0-4",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        maxzoom: 5,
        filter: ["all", ["==", "admin_level", 2], ["!has", "claimed_by"]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-blur": {
            base: 1,
            stops: [
              [0, 0.4],
              [22, 4],
            ],
          },
          "line-color": "rgb(230, 204, 207)",
          "line-opacity": 1,
          "line-width": {
            base: 1.1,
            stops: [
              [3, 1],
              [22, 20],
            ],
          },
        },
      },
      {
        id: "boundary_country_z5-",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        minzoom: 5,
        filter: ["==", "admin_level", 2],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-blur": {
            base: 1,
            stops: [
              [0, 0.4],
              [22, 4],
            ],
          },
          "line-color": "rgb(230, 204, 207)",
          "line-opacity": 1,
          "line-width": {
            base: 1.1,
            stops: [
              [3, 1],
              [22, 20],
            ],
          },
        },
      },
      {
        id: "precincts",
        type: "fill",
        source: `precincts-${site.precinctYears.slice(-1)[0]}`,
        "source-layer": "precincts",
        paint: {
          "fill-outline-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "rgba(0,0,0,0.7)",
            "rgba(0,0,0,0)",
          ],
          "fill-color": "rgba(0,0,0,0)",
        },
      },
      {
        id: "place_other",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        maxzoom: 14,
        filter: [
          "all",
          [
            "in",
            "class",
            "continent",
            "hamlet",
            "neighbourhood",
            "isolated_dwelling",
          ],
          ["==", "$type", "Point"],
        ],
        layout: {
          "text-anchor": "center",
          "text-field": "{name:latin}\n{name:nonlatin}",
          "text-font": ["Metropolis Regular"],
          "text-justify": "center",
          "text-offset": [0.5, 0],
          "text-size": 10,
          "text-transform": "uppercase",
          visibility: "visible",
        },
        paint: {
          "text-color": "rgb(117, 129, 145)",
          "text-halo-blur": 1,
          "text-halo-color": "rgb(242,243,240)",
          "text-halo-width": 1,
        },
      },
      {
        id: "place_suburb",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        maxzoom: 15,
        filter: ["all", ["==", "$type", "Point"], ["==", "class", "suburb"]],
        layout: {
          "text-anchor": "center",
          "text-field": "{name:latin}\n{name:nonlatin}",
          "text-font": ["Metropolis Regular"],
          "text-justify": "center",
          "text-offset": [0.5, 0],
          "text-size": 10,
          "text-transform": "uppercase",
          visibility: "visible",
        },
        paint: {
          "text-color": "rgb(117, 129, 145)",
          "text-halo-blur": 1,
          "text-halo-color": "rgb(242,243,240)",
          "text-halo-width": 1,
        },
      },
      {
        id: "place_village",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        maxzoom: 14,
        filter: ["all", ["==", "$type", "Point"], ["==", "class", "village"]],
        layout: {
          "icon-size": 0.4,
          "text-anchor": "left",
          "text-field": "{name:latin}\n{name:nonlatin}",
          "text-font": ["Metropolis Regular"],
          "text-justify": "left",
          "text-offset": [0.5, 0.2],
          "text-size": 10,
          "text-transform": "uppercase",
          visibility: "visible",
        },
        paint: {
          "icon-opacity": 0.7,
          "text-color": "rgb(117, 129, 145)",
          "text-halo-blur": 1,
          "text-halo-color": "rgb(242,243,240)",
          "text-halo-width": 1,
        },
      },
      {
        id: "place_town",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        maxzoom: 15,
        filter: ["all", ["==", "$type", "Point"], ["==", "class", "town"]],
        layout: {
          "icon-image": {
            base: 1,
            stops: [
              [0, "circle-11"],
              [8, ""],
            ],
          },
          "icon-size": 0.4,
          "text-anchor": {
            base: 1,
            stops: [
              [0, "left"],
              [8, "center"],
            ],
          },
          "text-field": "{name:latin}\n{name:nonlatin}",
          "text-font": ["Metropolis Regular"],
          "text-justify": "left",
          "text-offset": [0.5, 0.2],
          "text-size": 10,
          "text-transform": "uppercase",
          visibility: "visible",
        },
        paint: {
          "icon-opacity": 0.7,
          "text-color": "rgb(117, 129, 145)",
          "text-halo-blur": 1,
          "text-halo-color": "rgb(242,243,240)",
          "text-halo-width": 1,
        },
      },
      {
        id: "place_city",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        maxzoom: 14,
        filter: [
          "all",
          ["==", "$type", "Point"],
          [
            "all",
            ["!=", "capital", 2],
            ["==", "class", "city"],
            [">", "rank", 3],
          ],
        ],
        layout: {
          "icon-image": {
            base: 1,
            stops: [
              [0, "circle-11"],
              [8, ""],
            ],
          },
          "icon-size": 0.4,
          "text-anchor": {
            base: 1,
            stops: [
              [0, "left"],
              [8, "center"],
            ],
          },
          "text-field": "{name:latin}\n{name:nonlatin}",
          "text-font": ["Metropolis Regular"],
          "text-justify": "left",
          "text-offset": [0.5, 0.2],
          "text-size": 10,
          "text-transform": "uppercase",
          visibility: "visible",
        },
        paint: {
          "icon-opacity": 0.7,
          "text-color": "rgb(117, 129, 145)",
          "text-halo-blur": 1,
          "text-halo-color": "rgb(242,243,240)",
          "text-halo-width": 1,
        },
      },
      {
        id: "place_city_large",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        maxzoom: 12,
        filter: [
          "all",
          ["==", "$type", "Point"],
          [
            "all",
            ["!=", "capital", 2],
            ["<=", "rank", 3],
            ["==", "class", "city"],
          ],
        ],
        layout: {
          "icon-image": {
            base: 1,
            stops: [
              [0, "circle-11"],
              [8, ""],
            ],
          },
          "icon-size": 0.4,
          "text-anchor": {
            base: 1,
            stops: [
              [0, "left"],
              [8, "center"],
            ],
          },
          "text-field": "{name:latin}\n{name:nonlatin}",
          "text-font": ["Metropolis Regular"],
          "text-justify": "left",
          "text-offset": [0.5, 0.2],
          "text-size": 14,
          "text-transform": "uppercase",
          visibility: "visible",
        },
        paint: {
          "icon-opacity": 0.7,
          "text-color": "rgb(117, 129, 145)",
          "text-halo-blur": 1,
          "text-halo-color": "rgb(242,243,240)",
          "text-halo-width": 1,
        },
      },
    ],
  })
}
