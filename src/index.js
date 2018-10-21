'use strict'
const scaffold = require('eth-json-rpc-middleware/scaffold')
const sha3 = require('ethereumjs-util').sha3
const rlp = require('rlp')
const EthAccount = require('ethereumjs-account')

const DEFAULT_DEPTH = 6

module.exports = createSliceMiddleware

async function getSliceByBlockRef ({path, depth, blockRef, eth, sliceTracker}) {
  let slice = null
  if (blockRef === 'latest') {
    slice = await sliceTracker.getLatestSlice(path, depth)
  } else {
    const block = await eth.getBlockByNumber(blockRef, false)
    slice = await sliceTracker.getSliceForBlock(path, depth, block)
  }

  return slice
}

function lookupAccountInSlice ({slice, address}) {
  const node = findNode({ slice, key: address })
  const account = new EthAccount(node)
  if (account.isEmpty()) {
    throw new Error('empty account!')
  }
  return account
}

function getStorageFromSlice ({slice, key}) {
  const node = findNode({slice, key})
  return rlp.decode(node).toString('hex')
}

function findNode ({ slice, key }) {
  const rest = sha3(key).toString('hex').slice(4).split('')
  // TODO: we should calculate the head
  const head = rlp.decode(`0x${slice.trieNodes.head[Object.keys(slice.trieNodes.head)[0]]}`)
  const sliceNodes = slice.trieNodes.sliceNodes

  let node = Object.keys(sliceNodes).length > 0
    ? rlp.decode(`0x${sliceNodes[head[parseInt(rest.shift(), 16)].toString('hex')]}`)
    : head

  do {
    switch (node.length) {
      case 2:
        const first = node[0].toString('hex')
        const last = node[1]
        switch (parseInt(first[0], 16)) {
          case 0:
          case 1:
            continue
          case 2:
          case 3:
            return last
          default:
            throw new Error('unknown hex prefix on trie node')
        }
    }

    node = rlp.decode(`0x${sliceNodes[node[parseInt(rest.shift(), 16)].toString('hex')]}`)
  } while (rest.length)
}

function lookupCodeInSlice ({slice, address}) {
  return slice.leaves[sha3(address).toString('hex')].evmCode
}

function addrToPath (address) {
  const addrHash = sha3(address)
  return addrHash.toString('hex').slice(0, 4)
}

function createSliceMiddleware ({ sliceTracker, eth, depth }) {
  depth = depth || DEFAULT_DEPTH
  return scaffold({

    eth_getBalance: async (req, res, next, end) => {
      const [address, blockRef] = req.params
      const path = addrToPath(address)
      const slice = await getSliceByBlockRef({path, depth, blockRef, eth, sliceTracker})
      const account = lookupAccountInSlice({slice, address})
      res.result = `0x${account.balance.toString('hex')}`
      end()
    },

    eth_getTransactionCount: async (req, res, next, end) => {
      const [address, blockRef] = req.params
      const path = addrToPath(address)
      const slice = await getSliceByBlockRef({path, depth, blockRef, eth, sliceTracker})
      const account = lookupAccountInSlice({ slice, address })
      res.result = `0x${account.nonce.toString('hex')}`
      end()
    },

    eth_getCode: async (req, res, next, end) => {
      const [address, blockRef] = req.params
      const path = addrToPath(address)
      const slice = await getSliceByBlockRef({ path, depth, blockRef, eth, sliceTracker })
      res.result = `0x${lookupCodeInSlice({ slice, address })}`
      end()
    },

    eth_getStorageAt: async (req, res, next, end) => {
      const [address, key, blockRef] = req.params
      const path = addrToPath(address)
      const slice = await getSliceByBlockRef({path, depth, blockRef, eth, sliceTracker})
      const storageRoot = slice.leaves[sha3(address).toString('hex')].storageRoot
      const storagePath = addrToPath(key)
      const storageSlice = await sliceTracker.getSliceById(`${storagePath}-${depth}-${storageRoot}`)
      res.result = `0x${getStorageFromSlice({ slice: storageSlice, key })}`
      end()
    }
  })
}
