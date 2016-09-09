@isTest
private class Test_HelloWorld
{

	@isTest static void test_greet()
	{
		System.assertEquals('THIS IS SUPPOSED TO FAIL!', HelloWorld.greet('force-dev-tool'));
	}

}