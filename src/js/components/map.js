import { createEffect, createMemo, onCleanup, onMount } from "solid-js"
import { useMapStore } from "../providers/map"
import { usePopup } from "../providers/popup"
import { descending, fromEntries } from "../utils"
import { getDataCols, getColor } from "../utils/map"
import { getPrecinctYear, fetchCsvData, CONSTANTS } from "../utils/data"

const getSourceConfig = (sourceName) => {
  const year = sourceName.split("-")[1]
  return {
    type: "geojson",
    data: `/data/geojson/precincts-${year}.geojson`,
    maxzoom: 12,
    attribution:
      year == 1983
        ? '<a href="https://www.chicagoelectionsproject.com/" target="_blank">Chicago Elections Project</a>'
        : '<a href="https://chicagoelections.com/" target="_blank">Chicago Board of Election Commissioners</a>',
    promoteId: "id",
  }
}

const compactAttribControl = () => {
  const control = document.querySelector("details.maplibregl-ctrl-attrib")
  control.removeAttribute("open")
  control.classList.remove("mapboxgl-compact-show", "maplibregl-compact-show")
}

const filterExpression = (data) => [
  "in",
  ["get", "id"],
  ["literal", data.map(({ id }) => id)],
]

const aggregateElection = (data, election, race) => {
  const dataCols = Object.keys(data[0] || {}).filter(
    (row) =>
      row.includes("Percent") ||
      ["turnout", "registered", "ballots"].includes(row)
  )
  // TODO: Fix this, hacky override to make display less weird for 2023 mayor
  const candidateNames =
    election === "241" && race === "11"
      ? [
          "PAUL VALLAS",
          "BRANDON JOHNSON",
          "LORI E. LIGHTFOOT",
          'JESUS "CHUY" GARCIA',
          "WILLIE L. WILSON",
          "JA'MAL GREEN",
          "KAM BUCKNER",
          "SOPHIA KING",
          "RODERICK T. SAWYER",
        ]
      : dataCols.map((c) => c.replace(" Percent", ""))

  const aggBase = {
    total: 0,
    ...candidateNames.reduce((a, v) => ({ ...a, [v]: 0 }), {}),
  }
  const electionResults = data.reduce(
    (agg, val) =>
      Object.keys(agg).reduce((a, v) => ({ ...a, [v]: agg[v] + val[v] }), {}),
    aggBase
  )

  const candidates = candidateNames
    .filter((name) => !["ballots", "registered"].includes(name))
    .map((name, idx) => ({
      name,
      color: getColor(name, idx),
      votes: electionResults[name === "turnout" ? "total" : name],
    }))
    .sort((a, b) => descending(a.votes, b.votes))

  // TODO: simplify here, maybe pull out of candidates?
  const candidateColors = candidateNames
    .filter((name) => !["ballots", "registered"].includes(name))
    .reduce((a, v, idx) => ({ ...a, [v]: getColor(v, idx) }), {})

  // Workaround for turnout display
  if (electionResults.turnout) {
    electionResults.total = electionResults.registered
  } else if (isNaN(electionResults.total)) {
    electionResults.total = electionResults.ballots
  }
  return { candidates, candidateColors, electionResults }
}

const createPrecinctLayerDefinition = (data, election, race, year) => ({
  layerDefinition: {
    id: "precincts",
    source: `precincts-${getPrecinctYear(election, +year)}`,
    type: "fill",
    filter: filterExpression(data),
    paint: {
      "fill-outline-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "rgba(0,0,0,0.7)",
        "rgba(0,0,0,0)",
      ],
      "fill-color": [
        "case",
        ["==", ["feature-state", "colorValue"], null],
        "#ffffff",
        [
          "interpolate",
          ["linear"],
          ["feature-state", "colorValue"],
          0,
          "#ffffff",
          100,
          ["feature-state", "color"],
        ],
      ],
      "fill-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        1.0,
        10,
        1.0,
        14,
        0.8,
      ],
    },
  },
  legendData: aggregateElection(data, election, race),
})

function setFeatureData(map, dataCols, source, feature) {
  const featureData = fromEntries(
    Object.entries(feature).filter(([col]) => dataCols.includes(col))
  )

  const featureDataEntries = [...Object.entries(featureData)]
  const featureDataValues = featureDataEntries.map(([, value]) => value)
  const colorValue = Math.max(...featureDataValues)
  const colorIndex = dataCols.indexOf(
    featureDataEntries[featureDataValues.indexOf(colorValue)][0]
  )

  map.setFeatureState(
    {
      source,
      id: feature.id,
    },
    {
      color: getColor(featureDataEntries[colorIndex][0], colorIndex),
      colorValue: colorValue,
      ...feature,
    }
  )
}

const Map = (props) => {
  let map
  let mapRef

  const [mapStore, setMapStore] = useMapStore()
  const [, setPopup] = usePopup()

  const mapSource = createMemo(
    () => `precincts-${getPrecinctYear(props.election, props.year)}`
  )

  onMount(() => {
    map = new window.maplibregl.Map({
      container: mapRef,
      ...props.mapOptions,
    })
    map.touchZoomRotate.disableRotation()

    map.addControl(
      new window.maplibregl.AttributionControl({
        compact: props.isMobile,
      }),
      props.isMobile ? "top-left" : "bottom-right"
    )
    // Workaround for a bug in maplibre-gl where the attrib is default open
    if (props.isMobile) {
      compactAttribControl()
      const timeouts = [250, 500, 1000]
      timeouts.forEach((timeout) => {
        window.setTimeout(compactAttribControl, timeout)
      })
    }
    map.once("styledata", () => {
      map.addControl(
        new window.maplibregl.NavigationControl({ showCompass: false })
      )
      map.addControl(
        new window.maplibregl.FullscreenControl({ container: mapRef })
      )
      map.resize()
    })

    setMapStore({ map })
  })

  // Based on solidjs/solid/issues/670#issuecomment-930346644
  // eslint-disable-next-line solid/reactivity
  createEffect(async () => {
    let canceled = false
    onCleanup(() => (canceled = true))
    const data = await fetchCsvData(
      props.dataDomain,
      props.election,
      props.race
    )
    if (canceled) return

    const def = createPrecinctLayerDefinition(
      data,
      props.election,
      props.race,
      props.year
    )
    let dataCols = getDataCols(data[0] || [])
    // TODO: Fix this, hacky override to make display less weird for 2023 mayor
    if (props.election === "241" && props.race === "11") {
      dataCols = [
        "PAUL VALLAS",
        "BRANDON JOHNSON",
        "LORI E. LIGHTFOOT",
        'JESUS "CHUY" GARCIA',
        "WILLIE L. WILSON",
        "JA'MAL GREEN",
        "KAM BUCKNER",
        "SOPHIA KING",
        "RODERICK T. SAWYER",
      ].map((c) => `${c} Percent`)
    }

    setMapStore({ ...def.legendData })
    // Close popup on layer change
    setPopup({ click: false, hover: false })

    const updateLayer = () => {
      const sourceName = mapSource()
      if (mapStore.map.getLayer("precincts")) {
        mapStore.map.removeLayer("precincts")
        mapStore.map.removeFeatureState({
          source: sourceName,
        })
      }
      if (!mapStore.map.getSource(sourceName)) {
        mapStore.map.addSource(sourceName, getSourceConfig(sourceName))
      }
      data.forEach((feature) => {
        setFeatureData(map, dataCols, sourceName, feature)
      })
      mapStore.map.addLayer(def.layerDefinition, "place_other")
    }

    if (mapStore.map.isStyleLoaded()) {
      updateLayer()
    } else {
      mapStore.map.once("render", updateLayer)
    }
  })

  onCleanup(() => {
    map.remove()
  })

  return <div id="map" ref={mapRef} />
}

export default Map
