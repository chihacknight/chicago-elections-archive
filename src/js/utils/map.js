export const DEFAULT_ELECTION = "242"

export const COLOR_SCHEME = [
  "#1f77b4",
  "#d62728",
  "#2ca02c",
  "#ff7f0e",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
]

// TODO: Maybe add election and/or race key into this to be safe? Could be many "Johnson"s
const COLOR_OVERRIDES = {
  Clinton: "#1f77b4",
  Trump: "#d62728",
  Stein: "#2ca02c",
  Johnson: "#ff7f0e",
  "Tammy Duckworth": "#1f77b4",
  "Mark Steven Kirk": "#d62728",
  "Pat Quinn": "#1f77b4",
  "Bill Brady": "#d62728",
  "Alexander ''Alexi'' Giannoulias": "#1f77b4",
  "DESMON C. YANCY": "#ff7f0e",
  "ROBERT PALMER": "#7f7f7f",
  "RENITA Q. WARD": "#17becf",
}

export const getColor = (candidate, index) =>
  COLOR_OVERRIDES[candidate.replace(" Percent", "")] ||
  COLOR_SCHEME[index % COLOR_SCHEME.length]

export const getDataCols = (row) =>
  Object.keys(row || {}).filter(
    (row) => row.includes("Percent") || row === "turnout"
  )

export const getDataAccesor = (dataCols) => {
  if (dataCols.length === 1) {
    return (row) => ({
      value: row[dataCols[0]],
      id: row.id,
      ...row,
    })
  }

  return (row) =>
    dataCols.reduce(
      (acc, col) => {
        const value = row[col]
        if (value > acc.value) {
          acc.value = value
          acc.column = col
        }
        return acc
      },
      {
        value: -Math.pow(10, 10),
        column: "",
        id: row.id,
        ...row,
      }
    )
}
