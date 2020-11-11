/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import { MockProvider } from '@ethereum-waffle/provider';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { utils, Wallet } from 'ethers';

chai.use(chaiAsPromised);

const { namehash } = utils;

describe('Ownable', function () {
  let provider: MockProvider;
  let wallet: Wallet;

  /*
  let ownable: TestOwnableContract;
  let owner: string;
  let nonOwner: string;
  */

  before(async function () {
    this.timeout(4 * 1000);

    provider = new MockProvider();
    wallet = provider.getWallets()[0];

    //await provider.setupENS();
  });

  describe('onlyOwner', () => {
    it('should revert if sender is not the owner', async () => {
      /*
      const expectedError = new OwnableRevertErrors.OnlyOwnerError(
        nonOwner,
        owner
      );
      return expect(
        ownable.externalOnlyOwner().callAsync({ from: nonOwner })
      ).to.revertWith(expectedError);
      */
    });

    it('should succeed if sender is the owner', async () => {
      /*
      const isSuccessful = await ownable
        .externalOnlyOwner()
        .callAsync({ from: owner });
      expect(isSuccessful).to.be.true;
      */
    });
  });

  describe('transferOwnership', () => {
    it('should revert if the specified new owner is the zero address', async () => {
      /*
      const expectedError = new OwnableRevertErrors.TransferOwnerToZeroError();
      const tx = ownable
        .transferOwnership(constants.NULL_ADDRESS)
        .sendTransactionAsync({ from: owner });
      return expect(tx).to.revertWith(expectedError);
      */
    });

    it('should transfer ownership if the specified new owner is not the zero address', async () => {
      /*
      const receipt = await ownable
        .transferOwnership(nonOwner)
        .awaitTransactionSuccessAsync({ from: owner });

      // Ensure that the correct logs were emitted.
      expect(receipt.logs.length).to.be.eq(1);
      const [event] = filterLogsToArguments<
        IOwnableOwnershipTransferredEventArgs
      >(receipt.logs, IOwnableEvents.OwnershipTransferred);
      expect(event).to.be.deep.eq({ previousOwner: owner, newOwner: nonOwner });

      // Ensure that the owner was actually updated
      const updatedOwner = await ownable.owner().callAsync();
      expect(updatedOwner).to.be.eq(nonOwner);
      */
    });
  });
});
