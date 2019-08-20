//////////////////////////////////////////////////////////////////////////
// OrbitDB (TODO)
//////////////////////////////////////////////////////////////////////////

// TODO
DATABASE_NAME = '8bitbot'

ORBIT_DB_VERSION = '0.21.4'

ORBIT_DB_SRC = `https://unpkg.com/orbit-db@${ORBIT_DB_VERSION}/dist/orbitdb.min.js`

console.log(`OrbitDB version: ${ORBIT_DB_VERSION}`)

// TODO: Add to IPFS options
const options = {
  EXPERIMENTAL: {
    pubsub: true,
    sharding: true
  }
}

async function loadOrbitDB(node) {
  const orbitdb = await window.OrbitDB.createInstance(node)

  console.log(`Opening database '${DATABASE_NAME}'`)
  const db = await orbitdb.docs(DATABASE_NAME)

  const hash = await db.put({
    _id: 'Stockholm_Number_Ten.mp4',
    //data: 'QmTNcW7FZeFHmbSF7spDdkb355RGjq4NWYfWFZcw2oPre3' // Video
    //data: 'Qmc5gCcjYypU7y28oCALwfSvxCBskLuPKWpK4qpterKC7z' // Hello world
    //data: 'QmdpAidwAsBGptFB3b6A9Pyi5coEbgjHrL3K2Qrsutmj9K' // HLS test
    data: 'QmfQESQig6UourthiKNheKkmBvy9m4HUgbn5MWk7zQv8m3' // HLS video
  })

  const level = await db.get('Stockholm_Number_Ten.mp4')[0]
  //return level
}
