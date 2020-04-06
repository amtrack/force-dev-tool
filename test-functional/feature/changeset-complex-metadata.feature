Feature: Change Set: Handle Properties of Complex Metadata Types

  Scenario Outline: Child metadata are added and/or updated
    Given a list of "<child>" metadata in "<data>" folder which has been added and updated in a git repository
     When a user launches a change set with force-dev-tool
     Then it will create a change set with the list of "<changeSetTag>" metadata
      And excluding any "<excludedTag>" metadata in the change set
      And the change set could be deployed correctly

    @doing
    Examples:
      | parent       | child           | changeSetTag   | excludedTag    | data                                   |
      | CustomObject | CustomField     | CustomField    | CustomObject   | complex-metadata/customField-added     |

    Examples:
      | parent       | child           | changeSetTag   | excludedTag    | data                                   |
      | CustomObject | CustomField     | CustomField    | CustomObject   | complex-metadata/customField-added     |
      | CustomObject | BusinessProcess | CustomObject   | BusinessObject | complex-metadata/businessProcess-added |
      | CustomObject | RecordType      | RecordType     | CustomObject   | complex-metadata/recordType-added      |
      | CustomObject | WebLink         | WebLink        | CustomObject   | complex-metadata/weblink-added         |
      | CustomObject | ValidationRule  | ValidationRule | CustomObject   | complex-metadata/validationRule-added  |
      | CustomObject | FieldSet        | FieldSet       | CustomObject   | complex-metadata/fieldSet-added        |

    @notWorking @skipped
    Examples:
      | parent       | child           | changeSetTag   | excludedTag    | data                                   |
      | CustomObject | ListView        | ListView       | CustomObject   | complex-metadata/listView-added        |
      | CustomObject | CompactLayout   | CustomObject   | CompactLayout  | complex-metadata/compactLayout-added   |
      | CustomObject | SharingReason   | CustomObject   | SharingReason  | complex-metadata/sharingReason-added   |

  Scenario Outline: Child metadata are removed
    Given a list of "<child>" metadata in "<data>" folder which has been removed in a git repository
     When a user launches a change set with force-dev-tool
     Then it will create a destructive change with the list of "<child>" metadata
      And excluding any "<parent>" metadata in the change set
      And the change set could be deployed correctly

    Examples:
      | parent       | child           | data                                     |
      | CustomObject | CustomField     | complex-metadata/customField-removed     |
      | CustomObject | WebLink         | complex-metadata/weblink-removed         |
      | CustomObject | ValidationRule  | complex-metadata/validationRule-removed  |
      | CustomObject | FieldSet        | complex-metadata/fieldSet-removed        |
      | CustomObject | ListView        | complex-metadata/listView-removed        |

    @notWorking @skipped
    Examples:
      | parent       | child           | data                                     | error                                  |
      | CustomObject | BusinessProcess | complex-metadata/businessProcess-removed | destructiveChanges.xml is not created  |
      | CustomObject | RecordType      | complex-metadata/recordType-removed      | Cannot delete record type through API: https://developer.salesforce.com/forums/#!/feedtype=SINGLE_QUESTION_DETAIL&dc=Developer_Forums&criteria=ALLQUESTIONS&id=906F0000000AeeVIAS |
      | CustomObject | CompactLayout   | complex-metadata/compactLayout-removed   | destructiveChanges.xml is not created  |
      | CustomObject | SharingReason   | complex-metadata/sharingReason-removed   | destructiveChanges.xml is not created  |

  @doing @skipped
  Scenario Outline: Parent metadata are added, updated and/or removed
    Given a list of "<parent>" metadata in "<data>" folder which has been changed in a git repository
     When a user launches a change set with force-dev-tool
     Then it will create a change set with all "<parent>" metadata
      And excluding any "<child>" metadata in the change set
      And the change set could be deployed correctly

    Examples:
      | parent       | child       | data                                   |
      | CustomObject | CustomField | complex-metadata/label-updated         |
    # | CustomObject | CustomField | complex-metadata/compactLayout-added   |

  @todo @skipped
  Scenario: Parent & child metadata are changed
    Given a list of parent properties that doesn't belong to an independent child has been added/modified/removed in a git repository
      And a list of child metadata has been added/modified in a git repository
     When a user launches this change set with force-dev-tool
     Then it will create a change set with the list of independent component and with all parent metadata

  @todo @skipped
  Scenario: Parent are changed & child metadata are removed
    Given a list of parent properties that doesn't belong to an independent child has been added/modified/removed in a git repository
      And a list of independent child has been removed in a git repository
     When a user launches this change set with force-dev-tool
     Then it will create a destructive change with the list of independent component
      And it will create a change set with all parent metadata
