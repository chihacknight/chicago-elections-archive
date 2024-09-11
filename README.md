# Chicago Elections Archive

Explore precinct-level results from recent and historical Chicago elections.

![Screenshot of northeast Illinois presidential results](./src/img/chi-elections-social.png "Screenshot of 2019 Chicago mayoral general election results")

## Setup - native

```shell
poetry install
npm install
make all
```

## Setup - Docker

Set up local environment variables:

```shell
cp .env.sample .env
```

Build the containers and make the data:
```shell
docker-compose build
```

Run the site locally:
```shell
docker-compose up
```

## Updating Data

To update data, modify the `ELECTIONS` variable in `scripts/scrape_results_metadata.py` with the ID from the [Board of Election Commissioners website](https://chicagoelections.gov/en/election-results.html), and then regenerate `input/results-metadata.json` and `output/results-metadata.json`. Then re-run `make all`, or `docker-compose run --rm app make all` forcing execution if necessary.

Once this is done, `make build-output` can be run to GZIP all files in a separate directory that can be deployed to cloud storage with `make deploy`.

To update the displayed elections on the site, update `ELECTION_ORDER` in `site/_data/site.js`.

## Data Notes

- Missing precincts for years:
  - a few missing for 2004, 2003, 2002
  - 2000 missing a good amount
  - 1983 missing a few
