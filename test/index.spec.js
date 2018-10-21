/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const Eth = require('ethjs')
const JsonRpcEngine = require('json-rpc-engine')
const asMiddleware = require('json-rpc-engine/src/asMiddleware')
const RpcBlockTracker = require('eth-block-tracker')
const EthQuery = require('eth-query')
const TestBlockMiddleware = require('eth-block-tracker/test/util/testBlockMiddleware')
const createVmMiddleware = require('./create-vm-middleware')

const createSliceMiddleware = require('../src/index')

const transform = require('lodash.transform')
const camelCase = require('lodash.camelcase')
const isPlainObject = require('lodash.isplainobject')

const BALANCE_ADDRESS = '0x52bc44d5378309ee2abf1539bf71de1b7d7be3b5' // gnosis
const TOKEN_HOLDER_STORAGE_KEY = '0x04c7252b79c4d84f9705be5e66c098c238e636b660b234c6c6a46ec04cd00fcc'
const CONTRACT_ADDRESS = '0x6810e776880c02933d47db1b9fc05908e5386b96'

function normalizeSlice (obj) {
  return transform(obj, (result, value, key) => {
    if (key === 'metadata') { return }
    if (isPlainObject(value)) {
      value = normalizeSlice(value)
    }

    if (key.indexOf('-') > 0) {
      key = camelCase(key)
    }
    result[key] = value
  }, {})
}

const balanceSlice = normalizeSlice(require('./nano-pool-slice.json').result)
const tokenSlice = normalizeSlice(require('./token-holder-slice.json').result)
const tokenContractSlice = normalizeSlice(require('./token-contract-slice.json').result)

it('provider - balance query', function (done) {
  this.timeout(1000000)
  const { engine, testBlockSource, blockTracker } = createTestSetup()

  // unblock from waiting for block
  testBlockSource.nextBlock()
  blockTracker.start()

  // fire request for `test_method`
  engine.handle({ id: 1, method: 'eth_getBalance', params: [BALANCE_ADDRESS, 'latest'] }, (err, res) => {
    expect(err).not.to.exist('No error in response')
    expect(res).to.exist('Has response')
    expect(res.result).to.eql('0x01c2a6ee9ff24790f11f', 'Balance is incorrect')
    blockTracker.stop()
    done()
  })
})

it('provider - transaction count', function (done) {
  this.timeout(1000000)
  const { engine, testBlockSource, blockTracker } = createTestSetup()

  // unblock from waiting for block
  testBlockSource.nextBlock()
  blockTracker.start()

  // fire request for `test_method`
  engine.handle({ id: 1, method: 'eth_getTransactionCount', params: [BALANCE_ADDRESS, 'latest'] }, (err, res) => {
    expect(err).not.to.exist('No error in response')
    expect(res).to.exist('Has response')
    expect(res.result).to.eql('0x9511b1', 'Transaction count is incorrect')
    blockTracker.stop()
    done()
  })
})

it('provider - code ref', function (done) {
  this.timeout(1000000)
  const { engine, testBlockSource, blockTracker } = createTestSetup()

  // unblock from waiting for block
  testBlockSource.nextBlock()
  blockTracker.start()

  // fire request for `test_method`
  engine.handle({ id: 1, method: 'eth_getCode', params: [CONTRACT_ADDRESS, 'latest'] }, (err, res) => {
    expect(err).not.to.exist('No error in response')
    expect(res).to.exist('Has response')
    expect(res.result).to.eql('0x60606040523615610097576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806306fdde0314610099578063095ea7b31461013257806318160ddd1461018957806323b872dd146101af578063313ce5671461022557806370a082311461025157806395d89b411461029b578063a9059cbb14610334578063dd62ed3e1461038b575bfe5b34156100a157fe5b6100a96103f4565b60405180806020018281038252838181518152602001915080519060200190808383600083146100f8575b8051825260208311156100f8576020820191506020810190506020830392506100d4565b505050905090810190601f1680156101245780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561013a57fe5b61016f600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803590602001909190505061042e565b604051808215151515815260200191505060405180910390f35b341561019157fe5b610199610521565b6040518082815260200191505060405180910390f35b34156101b757fe5b61020b600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803573ffffffffffffffffffffffffffffffffffffffff16906020019091908035906020019091905050610527565b604051808215151515815260200191505060405180910390f35b341561022d57fe5b610235610791565b604051808260ff1660ff16815260200191505060405180910390f35b341561025957fe5b610285600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610796565b6040518082815260200191505060405180910390f35b34156102a357fe5b6102ab6107e0565b60405180806020018281038252838181518152602001915080519060200190808383600083146102fa575b8051825260208311156102fa576020820191506020810190506020830392506102d6565b505050905090810190601f1680156103265780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561033c57fe5b610371600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803590602001909190505061081a565b604051808215151515815260200191505060405180910390f35b341561039357fe5b6103de600480803573ffffffffffffffffffffffffffffffffffffffff1690602001909190803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610973565b6040518082815260200191505060405180910390f35b604060405190810160405280600c81526020017f476e6f73697320546f6b656e000000000000000000000000000000000000000081525081565b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a3600190505b92915050565b60025481565b600081600060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205410806105f1575081600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054105b156105fc5760006000fd5b81600060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254019250508190555081600060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254039250508190555081600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a3600190505b9392505050565b601281565b6000600060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490505b919050565b604060405190810160405280600381526020017f474e4f000000000000000000000000000000000000000000000000000000000081525081565b600081600060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205410156108695760006000fd5b81600060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254039250508190555081600060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040518082815260200191505060405180910390a3600190505b92915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490505b929150505600a165627a7a723058202e733d216c861d7ecce84e19c22f2140eeb24d6e7844461caf13eb41c5578ba00029', 'Code is incorrect')
    blockTracker.stop()
    done()
  })
})

it('provider - get storage at', function (done) {
  this.timeout(1000000)
  const { engine, testBlockSource, blockTracker } = createTestSetup()

  // unblock from waiting for block
  testBlockSource.nextBlock()
  blockTracker.start()

  // fire request for `test_method`
  engine.handle({ id: 1, method: 'eth_getStorageAt', params: [CONTRACT_ADDRESS, TOKEN_HOLDER_STORAGE_KEY, 'latest'] }, (err, res) => {
    expect(err).not.to.exist('No error in response')
    expect(res).to.exist('Has response')
    expect(res.result).to.eql('0x54b40b1f852bda000000', 'token balance is incorrect')
    blockTracker.stop()
    done()
  })
})

// util

function createTestSetup () {
  // raw data source
  const { engine: dataEngine, testBlockSource } = createEngineForTestData()
  const dataProvider = providerFromEngine(dataEngine)
  // create block tracker
  const blockTracker = new RpcBlockTracker({ provider: dataProvider })

  function getByPath (path) {
    if (path === '1372') {
      return balanceSlice
    }

    if (path === '0aa8') {
      return tokenContractSlice
    }

    if (path === '8e99') {
      return tokenSlice
    }

    throw new Error(`invalid path ${path}`)
  }

  // create dummy slice tracker
  const sliceTracker = {
    getLatestSlice: async (path) => {
      return getByPath(path)
    },
    getSliceForBlock: async (path) => {
      return getByPath(path)
    },
    getSliceById: async (id) => {
      const [path] = id.split('-')
      return getByPath(path)
    }
  }
  // create higher level
  const engine = new JsonRpcEngine()
  const provider = providerFromEngine(engine)

  // add vm middleware
  engine.push(createVmMiddleware({ provider }))
  // add block ref middleware
  engine.push(createSliceMiddleware({ blockTracker, sliceTracker }))
  // add data source
  engine.push(asMiddleware(dataEngine))
  const query = new EthQuery(provider)
  const eth = new Eth(provider)
  return { engine, provider, dataEngine, dataProvider, query, blockTracker, testBlockSource, eth }
}

function createEngineForTestData () {
  const engine = new JsonRpcEngine()
  const testBlockSource = new TestBlockMiddleware()
  engine.push(testBlockSource.createMiddleware())
  return { engine, testBlockSource }
}

function providerFromEngine (engine) {
  const provider = { sendAsync: engine.handle.bind(engine) }
  return provider
}
