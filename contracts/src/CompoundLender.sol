/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * This file is derived from the 0x Monorepo, available under the
 * Apache 2.0 license. https://github.com/0xProject/0x-monorepo
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

pragma solidity ^0.5.17;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '../depends/yearn/interfaces/compound/Token.sol';

contract CompoundLender {
  using SafeMath for uint256;

  /*//mainnnet
  address constant usdc = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
  address constant cusdc = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;
  address constant dai = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address constant cdai = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643;
  address constant usdt = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
  address constant cusdt = 0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9;
  */
  // kovan
  address constant usdc = 0xb7a4F3E9097C08dA09517b5aB877F7a917224ede;
  address constant cusdc = 0x4a92E71227D294F041BD82dd8f78591B75140d63;
  address constant dai = 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa;
  address constant cdai = 0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD;
  address constant usdt = 0x07de306FF27a2B630B1141956844eB1552B956B5;
  address constant cusdt = 0x3f0A0EA2f86baE6362CF9799B523BA06647Da018;

  /*// rinkeby
  address constant usdc = 0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b;
  address constant cusdc = 0x5B281A6DdA0B271e91ae35DE655Ad301C976edb1;
  address constant dai = 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa;
  address constant cdai = 0x6D7F0754FFeb405d23C51CE938289d4835bE3b14;
  address constant usdt = 0xD9BA894E0097f8cC2BBc9D24D308b98e36dc6D02;
  address constant cusdt = 0x2fB298BDbeF468638AD6653FF8376575ea41e768;
  */
  /*// ropsten
  address constant usdc = 0x0D9C8723B343A8368BebE0B5E89273fF8D712e3C;
  address constant cusdc = 0x8aF93cae804cC220D1A608d4FA54D1b6ca5EB361;
  address constant dai = 0x31F42841c2db5173425b5223809CF3A38FEde360;
  address constant cdai = 0x8354C3a332FFB24E3A27be252E01aCFE65A33B35;
  address constant usdt = 0x516de3a7A567d81737e3a46ec4FF9cFD1fcb0136;
  address constant cusdt = 0x135669c2dcBd63F639582b313883F101a4497F76;
  */

  function invest(address token, uint256 assetAmount) public returns (uint256) {
    address compoundToken = _token2cToken(token);
    require(compoundToken != address(0));

    // mint cToken
    uint256 poolTokens = IERC20(compoundToken).balanceOf(address(this));
    require(
      cToken(compoundToken).mint(assetAmount) == 0,
      'COMPOUND: mint failed'
    );

    return IERC20(compoundToken).balanceOf(address(this)).sub(poolTokens);
  }

  function redeem(address token, uint256 poolAmount) public returns (uint256) {
    address compoundToken = _token2cToken(token);
    require(compoundToken != address(0));

    // redeem tokens to this contract
    uint256 assetTokens = IERC20(token).balanceOf(address(this));
    require(
      cToken(compoundToken).redeem(poolAmount) == 0,
      'COMPOUND: redeem failed'
    );

    return IERC20(token).balanceOf(address(this)).sub(assetTokens);
  }

  // return the ratio asset / poolToken in 1E-18 decimals
  function getExchangeRate(address token) public view returns (uint256) {
    return cToken(_token2cToken(token)).exchangeRateStored();
  }

  function getApr(address token) public view returns (uint256) {
    return cToken(_token2cToken(token)).supplyRatePerBlock() * 2102400;
  }

  function getPoolToken(address token) public pure returns (address) {
    return _token2cToken(token);
  }

  function _token2cToken(address asset) internal pure returns (address) {
    if (asset == usdc) return cusdc;
    if (asset == dai) return cdai;
    if (asset == usdt) return cusdt;
    return address(0);
  }
}
