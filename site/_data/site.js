const electionMetadata = require("../../output/results-metadata.json")

const production = process.env.NODE_ENV === "production"

const host = production ? process.env.SITE_HOST : "http://0.0.0.0:8080"

// For modifying the <base> tag
const baseurl = production ? "" : ""

const ELECTION_ORDER = [
  "242",
  "241",
  "156",
  "252",
  "253",
  "254",
  "255",
  "251",
  "250",
  "240",
  "230",
  "220",
  "210",
  "200",
  "0",
  "1",
  "2",
  "3",
  "4",
  "8",
  "5",
  "6",
  "7",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25", // 2011 municipal general missing one precinct
  "26",
  "27",
  "29",
  "31",
  "33",
  "34",
  "36",
  "38",
  "40",
  "45",
  "50",
  "55",
  "60",
  "65",
  "70",
  "75",
  "80",
  "85",
  "90",
  "95",
  "100",
  "101",
  "105",
  "110",
  "115", // 2002
  // "116", // 2002 primaries (general fine for some reason)
  // "117",
  // "118",
  // "120", 2000
  // "124",
  // "125",
  "19831",
  "19830",
]

const elections = Object.entries(electionMetadata)
  .filter(([key]) => ELECTION_ORDER.includes(key))
  .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

module.exports = {
  name: "Chicago Elections Archive",
  title: "Chicago Elections Archive",
  description:
    "Explore precinct-level results of recent and historical Chicago elections",
  type: "website",
  baseurl,
  url: `${host}${baseurl}`,
  domain: host.replace("https://", ""),
  dataDomain:
    process.env.DATA_DOMAIN ||
    "chicago-elections-archive.us-east-1.linodeobjects.com",
  production,
  robots: production,
  plausibleAnalytics: !!process.env.PLAUSIBLE,
  locale: "en-US",
  azureMapsKey: process.env.AZURE_MAPS_KEY,
  precinctYears: [
    1983, 2000, 2003, 2004, 2007, 2008, 2010, 2011, 2012, 2015, 2019, 2021,
    2022, 2023,
  ],
  electionMetadata: {
    elections,
    electionOrder: ELECTION_ORDER,
    displayOverrides: {
      turnout: "Turnout",
      "Eira L. Corral SepÃºlveda": "Eira L. Corral Sepulveda",
    },
  },
  nav: [
    { url: "/about/", label: "About" },
    { url: "/download/", label: "Download" },
  ],
}
