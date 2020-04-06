# Local Test

Steps:

Create a scratch

```sh
sfdx force:org:create --definitionfile project-scratch-def.json --setdefaultusername -a scratch
```

```sh
./node_modules/.bin/cucumber-js feature/complex-metadata-types.feature --tags "not @skipped"
```

## Debug Tests

```sh
NODE_OPTIONS=--inspect-brk ./node_modules/.bin/cucumber-js feature/complex-metadata-types.feature --tags "not @skipped" --require step-definitions/complexMetadata.js --require step-definitions/changeSet.js
```

## Debug Cli

```sh
cd /var/folders/jw/x34nq5_j03zbyj33v7wwplr00000gn/T/tmp-17070a2nSyPncnxd1
git diff --no-renames HEAD~ HEAD | NODE_OPTIONS=--inspect-brk force-dev-tool changeset create test -f
```
