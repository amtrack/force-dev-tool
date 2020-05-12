Feature: Change Set: Handle Properties of Compound Metadata Types

  Scenario Outline: Compound metadata are added, updated and removed
    Given a list of "<compound>" metadata in "<data>" folder which has been changed in a git repository
     When a user launches a change set with force-dev-tool
     Then it will create a change set with all "<compound>" metadata
      And it will create a destructive change with the list of removed "<compound>" metadata
      And the change set could be deployed correctly

    Examples:
      | compound      | data                                         |
      | ApexClass     | compound-metadata/apex                       |
