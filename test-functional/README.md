# Functional Test

This folder contains the functional tests for `changeset create` command, based on [Gherkin](https://cucumber.io/docs/gherkin/) test definition language, and it is developed with [cucumberjs](https://github.com/cucumber/cucumber-js) framework.

The test definition are stored inside of `feature` folder, and the implementation are inside of the tests are inside of `step-definition` and  `lib` folders.

The `data` folder contains examples of metadata change set for testing.

## Launch tests

There's a specific npm scripts in the npm `package.json` file.

### Run test script

First make sure to install dependencies, and then you will able to run `test:functional` npm script.

```sh
npm install
npm run test:functional
```

This will print on the console:

```gherkin
Feature: Change Set: Handle Properties of Complex Metadata Types

  Scenario Outline: Child metadata are added and/or updated
    Given a list of "CustomField" metadata in "complex-metadata/customField-added" folder which has been added and updated in a git repository
    When a user launches a change set with force-dev-tool
    Then it will create a change set with the list of "CustomField" metadata
    And excluding any "CustomObject" metadata in the change set
    And the change set could be deployed
    - skipped

..more tests...

31 scenarios (31 skipped)
151 steps (31 skipped, 120 passed)
0m31.157s
```

### Run the automatic changeset deployment

The last step prints `the change set could be deployed` and it is skipped, there's two ways to deploy the changeset in a Org:

1. From a new scratch org

   ```sh
   sfdx force:org:create --definitionfile project-scratch-def.json -a functional-tests --setdefaultusername
   ```

1. Registering a previously created [Developer Edition](https://developer.salesforce.com/signup) Org

   ```sh
   sfdx force:auth:web:login -r https://login.salesforce.com -a functional-tests --setdefaultusername
   ```

In both cases, it is importante to set as default dev hub org with `--setdefaultusername`, because the step will deploy to the default dev hub org.

Once the environment is created then you must set an environment variable to don't skip the step:

```sh
export TEST_DEPLOY=true
```

### Run a specific feature

Once you are on the `test-functional` folder:

```sh
cd test-functional
```

If you want to launch a specific `feature` called `feature/complex-metadata-types.feature` you can ask it with the command line:

```sh
../node_modules/.bin/cucumber-js feature/complex-metadata-types.feature --require step-definitions/changeSet.js --format ../node_modules/cucumber-pretty"
```

### Run a specific test example

But if you want to test a specific test example you can tag the for example the `feature/changeset-simple-metadata.feature` file with a `@doing` tag like:

```gherkin
Feature: Change Set: Handle Properties of Simple Metadata Types

  Scenario Outline: Simple metadata are added, updated
    Given a list of "<simple>" metadata in "<data>" folder which has been changed in a git repository
     When a user launches a change set with force-dev-tool
     Then it will create a change set with all "<simple>" metadata
      And the change set could be deployed correctly

    @doing
    Examples:
      | simple        | data                                     |
      | PermissionSet | simple-metadata/permissionSet-changed    |

    Examples:
      | simple        | data                                     |
      ...
```

And launch the following npm script:

```sh
npm run test:functional:doing
```

This will print a message like:

```gherkin
> force-dev-tool@0.0.0-development test:functional:doing /Users/feliperoucheriglesias/salesforce/labs/force-dev-tool
> cd test-functional && cucumber-js feature/*.feature --tags '@doing' --require step-definitions/changeSet.js --format ../node_modules/cucumber-pretty

Feature: Change Set: Handle Properties of Simple Metadata Types

  @doing
  Scenario Outline: Simple metadata are added, updated
    Given a list of "PermissionSet" metadata in "simple-metadata/permissionSet-changed" folder which has been changed in a git repository
    When a user launches a change set with force-dev-tool
    Then it will create a change set with all "PermissionSet" metadata
    And the change set could be deployed correctly

    Temporal folder with git is '/var/folders/jw/x34nq5_j03zbyj33v7wwplr00000gn/T/tmp-3837OsD51M2PfRsl'

1 scenario (1 passed)
4 steps (4 passed)
0m19.841s
```

Note the line `Temporal folder with git is '/var/...'` is just for debug purpose, becaucse you can go in, and execute debug commands like `git diff` command:

```sh
cd /var/folders/jw/x34nq5_j03zbyj33v7wwplr00000gn/T/tmp-3837OsD51M2PfRsl
git diff --no-renames HEAD~ HEAD
```

You will watch the following differences:

```diff
diff --git a/src/permissionsets/Test.permissionset b/src/permissionsets/Test.permissionset
index 2b6a92b..0ebd002 100644
--- a/src/permissionsets/Test.permissionset
+++ b/src/permissionsets/Test.permissionset
@@ -1,5 +1,5 @@
 <?xml version="1.0" encoding="UTF-8"?>
 <PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
-    <hasActivationRequired>false</hasActivationRequired>
+    <hasActivationRequired>true</hasActivationRequired>
     <label>Test</label>
 </PermissionSet>
```

And you will able to execute force-dev-tool changeset command:

```sh
git diff --no-renames HEAD~ HEAD | force-dev-tool changeset create test -f
```

It prints:

```sh
Manifest:
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Test</members>
        <name>PermissionSet</name>
    </types>
    <version>46.0</version>
</Package>

exported metadata container to config/deployments/test
```

Or even debug force-dev-tool changeset command:

```sh
git diff --no-renames HEAD~ HEAD | NODE_OPTIONS=--inspect-brk force-dev-tool changeset create test -f
Debugger listening on ws://127.0.0.1:9229/c829fbe7-ff63-492f-99c2-32037e737d26
For help, see: https://nodejs.org/en/docs/inspector
```

And Attach node.js to the debug process, [vscode documentation](https://code.visualstudio.com/docs/nodejs/nodejs-debugging) could help you.
