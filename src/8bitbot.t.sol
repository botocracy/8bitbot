pragma solidity ^0.6.7;

import "ds-test/test.sol";

import "./8bitbot.sol";

contract 8bitbotTest is DSTest {
    8bitbot bitbot;

    function setUp() public {
        bitbot = new 8bitbot();
    }

    function testFail_basic_sanity() public {
        assertTrue(false);
    }

    function test_basic_sanity() public {
        assertTrue(true);
    }
}
