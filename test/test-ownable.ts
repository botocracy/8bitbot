/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * This file is derived from hardhat-deploy-ethers, available under the
 * MIT license. https://github.com/wighawag/hardhat-deploy-ethers
 *
 * SPDX-License-Identifier: Apache-2.0 AND MIT
 * See LICENSE.txt for more information.
 */

//
// TODO: Migrate to deployment fixtures
// See:
//
//   https://github.com/wighawag/template-ethereum-contracts/blob/main/test/ERC20Consumer.test.ts
//

import '@nomiclabs/hardhat-ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import * as hardhat from 'hardhat';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import { NULL_ADDRESS } from '../src/web3/constants';

chai.use(solidity);

// Supress type errors for properties injected by hardhat plugins
const deployEthers: any = hardhat.ethers;

const OWNABLE_FUNCTIONS = ['owner()', 'transferOwnership(address)'];
const TEST_OWNABLE_FUNCTIONS = [
  'externalOnlyOwner()',
  'owner()',
  'testTransferOwnership(address)',
  'transferOwnership(address)',
];

describe('Ownable', function () {
  let deployerAddress: string;
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  before(async function () {
    const namedAccounts = await hardhat.getNamedAccounts();

    deployerAddress = namedAccounts.deployer.toLowerCase();

    // Get the Signers
    [owner, nonOwner] = await hardhat.ethers.getSigners();
  });

  beforeEach(async function () {
    this.timeout(4 * 2000);

    await hardhat.deployments.fixture();
  });

  after(async function () {
    this.timeout(4 * 2000);

    await hardhat.deployments.fixture();
  });

  it('the provider should handle requests', async function () {
    const accounts = await hardhat.ethers.provider.send('eth_accounts', []);

    chai.expect(accounts[0]).to.equal(deployerAddress);
  });

  it('should return a contract factory', async function () {
    // It's already compiled in artifacts/
    const contract = await hardhat.ethers.getContractFactory(
      'contracts/src/Ownable.sol:Ownable'
    );

    chai.assert.containsAllKeys(
      contract.interface.functions,
      OWNABLE_FUNCTIONS
    );

    chai.assert.equal(
      await contract.signer.getAddress(),
      await owner.getAddress()
    );
  });

  describe('Ownable contract', function () {
    it('should return a contract instance', async function () {
      const contract = await deployEthers.getContract(
        'contracts/src/Ownable.sol:Ownable'
      );

      chai.assert.containsAllKeys(contract.functions, OWNABLE_FUNCTIONS);

      chai.assert.equal(
        await contract.signer.getAddress(),
        await owner.getAddress()
      );
    });
  });

  describe('TestOwnable contract', function () {
    it('should return a contract instance', async function () {
      const contract = await deployEthers.getContract(
        'contracts/test/TestOwnable.sol:TestOwnable'
      );

      chai.assert.containsAllKeys(contract.functions, TEST_OWNABLE_FUNCTIONS);

      chai.assert.equal(
        await contract.signer.getAddress(),
        await owner.getAddress()
      );
    });

    it('should have the right owner', async function () {
      // Expect the owner variable stored in the contract to be equal to the
      // Signer's owner
      const contract = await deployEthers.getContract(
        'contracts/test/TestOwnable.sol:TestOwnable'
      );

      chai.expect(await contract.owner()).to.equal(owner.address);
    });

    it('Should be able to send txs and make calls', async function () {
      const contract = await deployEthers.getContract(
        'contracts/test/TestOwnable.sol:TestOwnable'
      );

      chai.assert.equal(
        (await contract.functions.owner())[0], // TODO: Why wrapped in array?
        await owner.getAddress()
      );
      await contract.functions.testTransferOwnership(nonOwner.getAddress());
      chai.assert.equal(
        (await contract.functions.owner())[0], // TODO: Why wrapped in array?
        await nonOwner.getAddress()
      );
    });

    it('should return a contract instance associated with a custom signer', async function () {
      const contract = await deployEthers.getContract(
        'contracts/test/TestOwnable.sol:TestOwnable',
        nonOwner
      );

      chai.assert.equal(
        await contract.signer.getAddress(),
        await nonOwner.getAddress()
      );
    });

    it('should test externalOnlyOwner()', async function () {
      const contract = await deployEthers.getContract(
        'contracts/test/TestOwnable.sol:TestOwnable'
      );

      chai.expect(await contract.externalOnlyOwner()).to.be.true;
    });

    it('should revert if sender is not the owner', async function () {
      const contract = await deployEthers.getContract(
        'contracts/test/TestOwnable.sol:TestOwnable'
      );

      let testOwnableAsNonOwner = contract.connect(nonOwner);

      chai.expect(testOwnableAsNonOwner.externalOnlyOwner()).to.be.reverted;
    });

    it('should succeed if sender is the owner', async function () {
      const contract = await deployEthers.getContract(
        'contracts/test/TestOwnable.sol:TestOwnable'
      );

      let testOwnableAsOwner = contract.connect(owner);

      const isSuccessful = await testOwnableAsOwner.externalOnlyOwner();
      chai.expect(isSuccessful).to.be.true;
    });

    it('should revert if the specified new owner is the zero address', async function () {
      const contract = await deployEthers.getContract(
        'contracts/test/TestOwnable.sol:TestOwnable'
      );

      let testOwnableAsOwner = contract.connect(owner);

      return chai.expect(testOwnableAsOwner.testTransferOwnership(NULL_ADDRESS))
        .to.be.reverted;
    });

    it('should transfer ownership if the specified new owner is not the zero address', async function () {
      const contract = await deployEthers.getContract(
        'contracts/test/TestOwnable.sol:TestOwnable'
      );

      let testOwnableAsOwner = contract.connect(owner);

      const receipt = await testOwnableAsOwner.testTransferOwnership(
        nonOwner.getAddress()
      );

      // TODO: Ensure that the correct logs were emitted.
      //chai.expect(receipt.logs.length).to.be.eq(1);

      // Ensure that the owner was actually updated
      const updatedOwner = await contract.owner();
      chai.expect(updatedOwner).to.equal(nonOwner.address);
    });
  });
});
