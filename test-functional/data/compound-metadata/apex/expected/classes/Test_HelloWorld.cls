@isTest
private with sharing class Test_HelloWorld {
    @isTest
    static void test_greet() {
        System.assertEquals('Hello John Doe', HelloWorld.greet('John Doe'));
    }
}
