/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import chai from 'chai';
import * as ethersTypes from 'ethers';
import { ethers } from 'hardhat';
//import TestOwnable from '../artifacts/contracts/test/TestOwnable.sol/TestOwnable.json';
import { solidity } from 'ethereum-waffle';

chai.use(solidity);

describe('Ownable contract', function () {
  let testOwnable: ethersTypes.Contract;
  //let testOwnableContract: typeof TestOwnable;
  let owner: any; // TODO: SignerWithAddress
  let nonOwner: any; // TODO: SignerWithAddress

  // Before each test, re-deploy the contract every time
  beforeEach(async function () {
    // Get the ContractFactory and Signers
    const ownableFactory = await ethers.getContractFactory('TestOwnable');
    [owner, nonOwner] = await ethers.getSigners();

    // Deploy the contract and wait for the transaction to be mined
    testOwnable = await ownableFactory.deploy();
    await testOwnable.deployed();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      // Expect the owner variable stored in the contract to be equal to the
      // Signer's owner
      chai.expect(await testOwnable.owner()).to.equal(owner.address);
    });
  });

  describe('Only owner', function () {
    it('Should test externalOnlyOwner()', async function () {
      chai.expect(await testOwnable.externalOnlyOwner()).to.be.true;
    });

    it('should revert if sender is not the owner', async () => {
      /*
      const expectedError = new OwnableRevertErrors.OnlyOwnerError(
        nonOwner,
        owner
      );
      return chai
        .expect(ownable.externalOnlyOwner().callAsync({ from: nonOwner }))
        .to.revertWith(expectedError);
      */
      return chai.expect(testOwnable.externalOnlyOwner().callAsync({ from: nonOwner })).to.revertedWith('');
    });

    it('should succeed if sender is the owner', async () => {
      const isSuccessful = await testOwnable
        .externalOnlyOwner()
        .callAsync({ from: owner });

      chai.expect(isSuccessful).to.be.true;
    });
  });

  describe('Transfer ownership', function () {
    it('should revert if the specified new owner is the zero address', async function () {
      //const expectedError = new OwnableRevertErrors.TransferOwnerToZeroError();
      const expectedError = ''; // TODO
      const tx = testOwnable
        .transferOwnership(constants.NULL_ADDRESS)
        .sendTransactionAsync({ from: owner });
      return chai.expect(tx).to.revertWith(expectedError);
    });

    it('should transfer ownership if the specified new owner is not the zero address', async () => {
      const receipt = await testOwnable
        .transferOwnership(nonOwner)
        .awaitTransactionSuccessAsync({ from: owner });

      // Ensure that the correct logs were emitted.
      chai.expect(receipt.logs.length).to.be.eq(1);

      /*
      const [event] = filterLogsToArguments<
        IOwnableOwnershipTransferredEventArgs
      >(receipt.logs, IOwnableEvents.OwnershipTransferred);

      chai
        .expect(event)
        .to.be.deep.eq({ previousOwner: owner, newOwner: nonOwner });
      */

      // Ensure that the owner was actually updated
      const updatedOwner = await testOwnable.owner().callAsync();
      chai.expect(updatedOwner).to.be.eq(nonOwner);
    });
  });
});
