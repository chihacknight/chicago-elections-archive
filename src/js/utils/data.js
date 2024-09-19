import { csvParse } from "d3-dsv"

export const getPrecinctYear = (election, year) => {
  if (year > 1983 && year < 2003) return 2003
  if ([2014, 2015, 2016].includes(year)) return 2015
  if (year === 2006) return 2007
  if (["252", "253", "254", "255"].includes(election)) return 2021
  return [
    2023, 2022, 2021, 2019, 2015, 2012, 2011, 2010, 2008, 2007, 2004, 2003,
    1983,
  ].find((y) => year >= y)
}

export function fetchGeojsonData(dataDomain, election, year) {
  return fetch(
    `https://${dataDomain}/precincts-${getPrecinctYear(election, year)}.geojson`
  ).then((data) => data.json())
}

export function fetchCsvData(dataDomain, election, race) {
  return fetch(`https://${dataDomain}/results/${election}/${race}.csv`)
    .then((data) => data.text())
    .then((data) =>
      csvParse(data).map((row) =>
        Object.entries(row)
          .map(([key, value]) => {
            const keyName = key.split(" &")[0]
            let cleanKey =
              key.includes("Percent") && key.includes("&")
                ? `${keyName} Percent`
                : keyName
            // Handling discrepancy where turnout doesn't have "total" column
            if (row.turnout && cleanKey === "ballots") {
              cleanKey = "total"
            }
            return { [cleanKey]: key === `id` ? value : +value }
          })
          .reduce((acc, cur) => ({ ...acc, ...cur }), {})
      )
    )
}

export function mergeCsvAndGeojson(csvData, geojsonData) {
  const csvDataMap = csvData.reduce(
    (acc, { id, ...data }) => ({ ...acc, [id]: data }),
    {}
  )
  geojsonData.features.forEach((feat) => {
    feat.properties = {
      id: feat.properties.id,
      ...(csvDataMap[feat.properties.id] || {}),
    }
  })
  geojsonData.features = geojsonData.features.filter(
    (feat) => !!feat.properties.precinct
  )
  return geojsonData
}
