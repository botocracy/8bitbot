/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

require('hardhat-deploy');
require('hardhat-deploy-ethers');

const func = async function (hardhat_re) {
  const { deployments, ethers, getNamedAccounts } = hardhat_re;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy('contracts/src/Ownable.sol:Ownable', {
    from: deployer,
    args: [deployer],
    gas: 4000000,
    log: true,
    deterministicDeployment: true,
  });
};

module.exports = func;
func.tags = ['Ownable'];
