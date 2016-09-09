@isTest
private class Test_HelloWorld
{

	@isTest static void test_greet()
	{
		System.assertEquals('Hello force-dev-tool', HelloWorld.greet('force-dev-tool'));
	}

}