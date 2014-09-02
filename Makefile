###
# Make file for project.
#
# Downloads, filters, and converts data
#
###

# Directories
data := data
original := $(data)/original
build := $(data)/build
processing := $(data)/processing

# Original data
source_pvi := $(original)/pvi-cartogram-data.csv

# Converted
build_pvi_json := $(build)/pvi.json
build_districts_json := $(build)/districts.json




# Convert CSV to JSON
$(build_pvi_json): $(source_pvi)
	csvjson $(source_pvi) --key="District" > $(build_pvi_json)
# Get districts keys in array for aRanger
$(build_districts_json): $(build_pvi_json)
	cat $(build_pvi_json) | jq 'keys' -c > $(build_districts_json)

convert: $(build_pvi_json) $(build_districts_json)
clean_convert:
	rm -rv $(build)/*


# General
all: convert
clean: clean_convert
