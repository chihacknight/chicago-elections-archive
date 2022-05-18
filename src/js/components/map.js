import { createEffect, createMemo, onCleanup, onMount } from "solid-js"
import { csvParse } from "d3-dsv"
import { useMapStore } from "../providers/map"
import { descending, fromEntries } from "../utils"
import { COLOR_SCHEME, getDataCols, getPrecinctYear } from "../utils/map"

function fetchCsvData(election, race) {
  return fetch(
    `https://chicago-elections-archive.us-east-1.linodeobjects.com/results/${election}/${race}.csv`
  )
    .then((data) => data.text())
    .then((data) =>
      csvParse(data).map((row) =>
        Object.entries(row)
          .map(([key, value]) => {
            const keyName = key.split(" &")[0]
            const cleanKey =
              key.includes("Percent") && key.includes("&")
                ? `${keyName} Percent`
                : keyName
            return { [cleanKey]: key === `id` ? value : +value }
          })
          .reduce((acc, cur) => ({ ...acc, ...cur }), {})
      )
    )
}

const filterExpression = (data) => [
  "in",
  ["get", "id"],
  ["literal", data.map(({ id }) => id)],
]

const aggregateElection = (data) => {
  const dataCols = getDataCols(data[0] || [])
  const candidateNames = dataCols.map((c) => c.replace(" Percent", ""))

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
    .map((name, idx) => ({
      name,
      color: COLOR_SCHEME[idx % COLOR_SCHEME.length],
      votes: electionResults[name],
    }))
    .sort((a, b) => descending(a.votes, b.votes))

  return { candidates, electionResults }
}

const createPrecinctLayerDefinition = (data, year) => ({
  layerDefinition: {
    id: "precincts",
    source: `precincts-${getPrecinctYear(+year)}`,
    type: "fill",
    // TODO: By default fill-color should exclude, see if that's enough
    filter: filterExpression(data),
    paint: {
      "fill-outline-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "rgba(0,0,0,0.7)",
        "rgba(0,0,0,0)",
      ],
      "fill-color": [
        "interpolate",
        ["linear"],
        ["feature-state", "colorValue"],
        0,
        "#ffffff",
        100,
        ["feature-state", "color"],
      ],
    },
  },
  legendData: aggregateElection(data),
})

function setFeatureData(map, dataCols, source, feature) {
  const featureData = fromEntries(
    Object.entries(feature).filter(([col]) => dataCols.includes(col))
  )
  const featureDataValues = Object.entries(featureData).map(
    ([, value]) => value
  )
  const colorValue = Math.max(...featureDataValues)
  const colorIndex = featureDataValues.indexOf(colorValue)
  map.setFeatureState(
    {
      source,
      id: feature.id,
    },
    {
      color: COLOR_SCHEME[colorIndex % COLOR_SCHEME.length],
      colorValue: colorValue,
      ...feature,
    }
  )
}

// TODO: A lot of refactoring here
const Map = (props) => {
  let map
  let mapRef

  const [mapStore, setMapStore] = useMapStore()

  const mapSource = createMemo(() => `precincts-${getPrecinctYear(props.year)}`)

  onMount(() => {
    map = new window.maplibregl.Map({
      container: mapRef,
      ...props.mapOptions,
    })
    map.touchZoomRotate.disableRotation()

    setMapStore({ ...mapStore, map })
  })

  createEffect(() => {
    // TODO: There's a race condition in here somewhere
    fetchCsvData(props.election, props.race).then((data) => {
      const def = createPrecinctLayerDefinition(data, props.year)

      const dataCols = getDataCols(data[0] || [])

      setMapStore({ ...mapStore, ...def.legendData })

      const updateLayer = () => {
        map.removeLayer("precincts")
        map.removeFeatureState({
          source: mapSource(),
        })
        data.forEach((feature) => {
          setFeatureData(map, dataCols, mapSource(), feature)
        })
        map.addLayer(def.layerDefinition, "place_other")
      }

      if (map.isStyleLoaded()) {
        updateLayer()
      } else {
        map.once("styledata", updateLayer)
      }
    })
  })

  onCleanup(() => {
    map.remove()
  })

  return <div id="map" ref={mapRef}></div>
}

export default Map
