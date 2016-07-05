#!/usr/bin/env bash

DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

sed -i '' \
	-e 's/"createdDate".*/"createdDate": "1970-01-01T00:00:00.000Z",/g' \
	-e 's/"lastModifiedDate".*/"lastModifiedDate": "1970-01-01T00:00:00.000Z",/g' \
	-e 's/"createdById".*/"createdById": "005w0000003zTZPAA2",/g' \
	-e 's/"lastModifiedById".*/"lastModifiedById": "005w0000003zTZPAA2",/g' \
	-e 's/"createdByName".*/"createdByName": "John Doe",/g' \
	-e 's/"lastModifiedByName".*/"lastModifiedByName": "John Doe",/g' \
	${DIR}/../test/data/*manifest.json
