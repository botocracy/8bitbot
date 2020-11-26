/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

//////////////////////////////////////////////////////////////////////////
// External libraries
//////////////////////////////////////////////////////////////////////////

// CID for external libraries
const DISTRO_CID = 'QmUATZDVu9A4m9kn2uNDgFafiDpkUKyPWdiunp1zNZ4NFs';

// IPFS libraries
const JS_IPFS_VERSION = '0.47.0';
const ORBIT_DB_VERSION = '0.24.2';

// URIs
const JS_IPFS_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/ipfs_${JS_IPFS_VERSION}/index.min.js`;
const ORBIT_DB_SRC = `${IPFS_GATEWAY}/ipfs/${DISTRO_CID}/orbit-db_${ORBIT_DB_VERSION}/orbitdb.min.js`;

//////////////////////////////////////////////////////////////////////////
// Application parameters
/////////////////////////////////////////////////////////////////////////

// TODO
const DATABASE_NAME = '8bitbot';
//////////////////////////////////////////////////////////////////////////
// Application logic
//////////////////////////////////////////////////////////////////////////

// Bootstraps IPFS and transfers control to our entry points
async function bootstrapIpfs() {
  log_ipfs(`Bootstrapping IPFS`);

  log_ipfs(`Downloading IPFS libraries`);
  await Promise.all([loadScript(JS_IPFS_SRC), loadScript(ORBIT_DB_SRC)]);
  log_ipfs(`Finished downloading IPFS libraries`);

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

  // Log node status
  const status = node.isOnline() ? 'online' : 'offline';
  log_ipfs(`IPFS node status: ${status}`);

  //
  // IPFS is ready to use!
  // See https://github.com/ipfs/js-ipfs#core-api
  //

  // Load OrbitDB
  await loadOrbitDB(node);
}

// Publish an object to OrbitDB
async function publishMessage(message) {
  log_ipfs(`Publishing message:`);
  console.log(message);

  // TODO: Fix global dependency
  window.sellOrder = message;

  // TODO
  //runBuyerAction(window.web3Wrapper);
}

// Handle an object received by OrbitDB
async function handleMessage(message) {
  // Recover the sell order
  //sellOrder = decodeMessage(message);
  // Expose the sell order to the user
  //window.sellOrder = sellOrder;
}

//////////////////////////////////////////////////////////////////////////
// OrbitDB (TODO)
//////////////////////////////////////////////////////////////////////////

async function loadOrbitDB(ipfsNode) {
  // Create the database
  log_ipfs(`Creating OrbitDB database`);
  const orbitdb = await window.OrbitDB.createInstance(ipfsNode);

  log_ipfs(`   DB name: ${DATABASE_NAME}`);
  const db = await orbitdb.log(DATABASE_NAME);

  log_ipfs(`   DB address: ${db.address.toString()}`);

  /* TODO
  dbAddress = db.address.toString();

  db2 = await orbitdb.log(dbAddress);

  db2.events.on('replicated', () => {
    const result = db2.iterator({limit: -1}).collect().map(e => e.payload.value);
    log_ipfs(`Result:`);
    console.log(result);
  });
  */
}

//////////////////////////////////////////////////////////////////////////
// Utilities
//////////////////////////////////////////////////////////////////////////

// Load a script asynchronously
function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var script;
    script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function log_ipfs(message) {
  console.log(`[IPFS  ] ${message}`);
}

//////////////////////////////////////////////////////////////////////////
// Async entry points
//////////////////////////////////////////////////////////////////////////

bootstrapIpfs();
