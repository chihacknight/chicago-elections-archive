S3_BUCKET = chicago-elections-archive
S3_REGION = us-east-1

PRECINCT_YEARS := 1983 2000 2003 2004 2007 2008 2010 2011 2012 2015 2019 2021 2022 2023
ELECTION_IDS := $(shell cat input/results-metadata.json | jq -r 'keys[]')
IGNORE_RESULTS := output/results/7/334.csv output/results/7/335.csv output/results/80/250.csv output/results/80/255.csv output/results/80/253.csv output/results/80/261.csv output/results/80/266.csv 
RESULTS := $(filter-out $(IGNORE_RESULTS),$(foreach id,$(ELECTION_IDS),$(foreach result,$(shell cat input/results-metadata.json | jq -r '."$(id)".races|keys[]'),output/results/$(id)/$(result).csv)))

.PHONY: all
all: input/results-metadata.json output/results-metadata.json $(RESULTS) $(foreach year,$(PRECINCT_YEARS),output/precincts-$(year).geojson tiles/precincts-$(year)/)

.PRECIOUS: input/%.html output/results/%.csv

.PHONY: deploy
deploy:
	s3cmd sync ./deploy-output/* s3://$(S3_BUCKET)/ \
		--region=$(S3_REGION) \
		--host=$(S3_REGION).linodeobjects.com \
		--host-bucket="%(bucket)s.$(S3_REGION).linodeobjects.com" \
		--progress \
		--no-preserve \
		--acl-public \
		--no-mime-magic \
		--guess-mime-type \
		--add-header 'Content-Encoding: gzip' \
		--add-header 'Cache-Control: "public, max-age=0, must-revalidate"'

.PHONY: deploy-results-%
deploy-results-%:
	s3cmd sync ./deploy-output/results/$*/* s3://$(S3_BUCKET)/results/$*/ \
		--region=$(S3_REGION) \
		--host=$(S3_REGION).linodeobjects.com \
		--host-bucket="%(bucket)s.$(S3_REGION).linodeobjects.com" \
		--progress \
		--no-preserve \
		--acl-public \
		--no-mime-magic \
		--guess-mime-type \
		--add-header 'Content-Encoding: gzip' \
		--add-header 'Cache-Control: "public, max-age=0, must-revalidate"'

# GZIP-compress output before it's synced with s3cmd
.PHONY: build-output
build-output:
	mkdir -p deploy-output
	cp -r output/* deploy-output
	find deploy-output -type f -exec gzip -9 {} \; -exec mv {}.gz {} \;

.PHONY: build-output-results-%
build-output-results-%:
	mkdir -p deploy-output/results/$*
	cp -r output/results/$*/* deploy-output/results/$*
	find deploy-output/results/$* -type f -exec gzip -9 {} \; -exec mv {}.gz {} \;

.PHONY: deploy-tiles
deploy-tiles:
	s3cmd sync ./tiles/ s3://$(S3_BUCKET)/tiles/ \
		--region=$(S3_REGION) \
		--host=$(S3_REGION).linodeobjects.com \
		--host-bucket="%(bucket)s.$(S3_REGION).linodeobjects.com" \
		--progress \
		--no-preserve \
		--acl-public \
		--no-mime-magic \
		--guess-mime-type \
		--add-header 'Content-Encoding: gzip' \
		--add-header 'Cache-Control: "public, max-age=86400"'

.PHONY: deploy-tiles-%
deploy-tiles-%:
	s3cmd sync ./tiles/precincts-$*/ s3://$(S3_BUCKET)/tiles/precincts-$*/ \
		--region=$(S3_REGION) \
		--host=$(S3_REGION).linodeobjects.com \
		--host-bucket="%(bucket)s.$(S3_REGION).linodeobjects.com" \
		--progress \
		--no-preserve \
		--acl-public \
		--no-mime-magic \
		--guess-mime-type \
		--add-header 'Content-Encoding: gzip' \
		--add-header 'Cache-Control: "public, max-age=86400"'

tiles/%/: output/%.mbtiles
	mkdir -p $@
	tile-join --no-tile-size-limit --force -e $@ $<

.PRECIOUS:
output/%.mbtiles: output/%.geojson
	tippecanoe \
		--simplification=10 \
		--simplify-only-low-zooms \
		--minimum-zoom=5 \
		--maximum-zoom=12 \
		--no-tile-stats \
		--detect-shared-borders \
		--grid-low-zooms \
		--coalesce-smallest-as-needed \
		--attribute-type=id:string \
		--use-attribute-for-id=id \
		--force \
		-L precincts:$< -o $@

output/precincts-2023.geojson: input/raw-precincts-2023.geojson
	mapshaper -i $< \
	-simplify 10% \
	-rename-fields id=Ward_Prec \
	-filter-fields id \
	-o $@

output/precincts-2022.geojson: input/raw-precincts-2022.geojson
	mapshaper -i $< \
	-simplify 10% \
	-rename-fields id=FIRST_full \
	-filter-fields id \
	-o $@

# Originally pulled with
# esri2geojson https://gisapps.cityofchicago.org/arcgis/rest/services/ExternalApps/operational/MapServer/116 -
output/precincts-2021.geojson: input/precincts-2021.geojson input/cook-precincts.geojson
	mapshaper -i $^ combine-files snap \
	-simplify 10% \
	-filter-fields id \
	-merge-layers force \
	-o $@

output/precincts-2012.geojson: input/raw-precincts-2012.geojson input/wards.geojson
	mapshaper -i $< snap \
	-proj crs=wgs84 \
	-clip $(filter-out $<,$^) \
	-simplify 10% \
	-each 'WARD = (+id.slice(0, 2)).toString()' \
	-each 'PRECINCT = (+id.slice(2)).toString()' \
	-o $@

output/precincts-%.geojson: input/wards.geojson
	wget -qO - https://raw.githubusercontent.com/datamade/chicago-municipal-elections/master/precincts/$*_precincts.geojson | \
	mapshaper -i - snap \
	-clip $< \
	-simplify 10% \
	-each 'WARD = WARD.toString()' \
	-each 'PRECINCT = PRECINCT.toString()' \
	-each 'id = WARD.padStart(2, "0") + PRECINCT.padStart(3, "0")' \
	-filter-fields id,WARD,PRECINCT \
	-o $@

# Hacky workaround for getting Cook results for some races
output/results/252/17.csv: input/252/17.html input/cook-252/17.csv
	mkdir -p $(dir $@)
	poetry run python scripts/scrape_table.py $< > $@
	xsv slice --no-headers -s 1 $(filter-out $<,$^) >> $@

output/results/252/19.csv: input/252/19.html input/cook-252/19.csv
	mkdir -p $(dir $@)
	poetry run python scripts/scrape_table.py $< > $@
	xsv slice --no-headers -s 1 $(filter-out $<,$^) >> $@

output/results/252/23.csv: input/252/23.html input/cook-252/23.csv
	mkdir -p $(dir $@)
	poetry run python scripts/scrape_table.py $< > $@
	xsv slice --no-headers -s 1 $(filter-out $<,$^) >> $@

output/results/252/109.csv: input/252/109.html input/cook-252/109.csv
	mkdir -p $(dir $@)
	poetry run python scripts/scrape_table.py $< > $@
	xsv slice --no-headers -s 1 $(filter-out $<,$^) >> $@

output/results/252/14.csv: input/252/14.html input/cook-252/14.csv
	mkdir -p $(dir $@)
	poetry run python scripts/scrape_table.py $< > $@
	xsv slice --no-headers -s 1 $(filter-out $<,$^) >> $@

output/results/210/9.csv: output/results/210/9-int.csv output/results/210/10-int.csv
	xsv join id $< id $(filter-out $<,$^) > $@

.INTERMEDIATE:
output/results/210/9-int.csv: input/210/9.html
	mkdir -p $(dir $@)
	poetry run python scripts/scrape_table.py $< > $@

.INTERMEDIATE:
output/results/210/10-int.csv: output/results/210/10.csv
	xsv select 1,7- $< > $@

output/results/%/0.csv: input/%/0.html
	mkdir -p $(dir $@)
	echo "id,ward,precinct,registered,ballots,turnout" > $@
	poetry run python scripts/scrape_table.py $< | \
	xsv select --no-headers 1-3,6,7,9 -| \
	xsv slice --no-headers -s 1 - >> $@

output/results/%.csv: input/%.html
	mkdir -p $(dir $@)
	poetry run python scripts/scrape_table.py $< > $@

input/cook-precincts.geojson: input/raw-cook-precincts.geojson
	mapshaper -i $< \
	-each 'id = name' \
	-filter-fields id \
	-o $@

input/raw-cook-precincts.geojson:
	poetry run esri2geojson https://gis12.cookcountyil.gov/arcgis/rest/services/electionSrvcLite/MapServer/1 $@

input/precincts-2021.geojson: input/raw-precincts-2021.geojson input/wards.geojson
	mapshaper -i $< snap \
	-proj crs=wgs84 \
	-clip $(filter-out $<,$^) \
	-each 'id = WARD_PRECINCT' \
	-filter-fields id \
	-o $@

input/raw-precincts-%.geojson:
	wget -O $@ https://chicago-elections-archive.us-east-1.linodeobjects.com/raw-precincts-$*.geojson

output/precincts-1983.geojson: input/wards.geojson
	wget -qO - https://raw.githubusercontent.com/datamade/chicago-municipal-elections/master/precincts/1983_precincts.geojson | \
	mapshaper -i - snap \
	-clip $< \
	-simplify 10% \
	-each 'WARD = Ward.toString()' \
	-each 'PRECINCT = Precinct.toString()' \
	-each 'id = WARD.padStart(2, "0") + PRECINCT.padStart(3, "0")' \
	-filter-fields id,WARD,PRECINCT \
	-o $@

output/results/19831/0.csv: input/1983/19831.csv
	mkdir -p $(dir $@)
	cat $< | poetry run python scripts/process_1983.py > $@

output/results/19830/0.csv: input/1983/19830.csv
	mkdir -p $(dir $@)
	cat $< | poetry run python scripts/process_1983.py > $@

input/cook-252/%.csv:
	mkdir -p $(dir $@)
	poetry run python scripts/scrape_cook_2022_primary.py $* > $@

input/1983/19831.csv: input/1983/
	poetry run in2csv input/1983/Mayoral_General/ElectionResults_Spreadsheet/1983_MayoralGeneral_ElectionResultsSpreadsheet.xlsx > $@

input/1983/19830.csv: input/1983/
	poetry run in2csv input/1983/Mayoral_Primary/ElectionResults_Spreadsheet/1983_MayoralPrimary_ElectionResultsSpreadsheet.xlsx > $@

input/1983/: input/1983.zip
	unzip -DD -d input $<

input/1983.zip:
	wget -O $@ https://data.lib.vt.edu/ndownloader/files/26588033

input/%.html:
	mkdir -p $(dir $@)
	curl https://chicagoelections.gov/en/election-results-specifics.asp \
	-X POST \
	-H "Content-Type: application/x-www-form-urlencoded" \
	-d "election=$(word 1,$(subst /, ,$*))&race=$(filter-out 0,$(word 2,$(subst /, ,$*)))&ward=&precinct=" -o $@

output/results-metadata.json: input/results-metadata.json
	cat $< | poetry run python scripts/process_results_metadata.py > $@

input/results-metadata.json:
	poetry run python scripts/scrape_results_metadata.py > $@

input/wards.geojson:
	wget -O $@ 'https://data.cityofchicago.org/api/geospatial/sp34-6z76?method=export&format=GeoJSON'
