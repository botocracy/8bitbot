import chai from 'chai';
import Ipfs from 'ipfs';
import OrbitDB from 'orbit-db';

// Bootstraps IPFS and transfers control to our entry points
async function bootstrapIpfs() {
  // IPFS options
  const options = {
    repo: `ipfs-${Math.random()}`,
    EXPERIMENTAL: {
      ipnsPubsub: true,
      sharding: true,
    },
  };

  // Create IPFS node
  const node = await Ipfs.create(options);

  //
  // IPFS is ready to use!
  // See https://github.com/ipfs/js-ipfs#core-api
  //

  return node;
}

describe('js-ipfs', function () {
  before(async function () {
    // Allow up to 10s to connect to the network
    this.timeout(10000);

    console.log(`Bootstrapping IPFS`);

    this.node = await bootstrapIpfs();
  });

  after(async function () {
    await this.node.stop();
  });

  it('should be imported', async function () {
    chai.expect(Ipfs).to.be.an('object');
  });

  it('should have a version', async function () {
    const version = await this.node.version();

    console.log(`The IPFS node version is ${version.version}`);

    chai.expect(version.version).to.be.a('string');
  });

  it('should be online', async function () {
    chai.expect(this.node.isOnline()).to.be.true;
  });
});
