'use strict'
const sha3 = require('ethereumjs-util').sha3
const LeftPad = require('leftpad')

const [, , address, pos] = process.argv

const key = LeftPad(address, 64) + LeftPad(pos, 64)
console.log(key)

const storage = sha3(Buffer.from(key, 'hex'))

console.log(storage.toString('hex'))
