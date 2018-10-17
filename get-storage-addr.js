'use strict'
const sha3 = require('ethereumjs-util').sha3
const LeftPad = require('leftpad')

const [, , address, pos] = process.argv

const key = LeftPad(address, 32) + LeftPad(pos, 32)
console.log(key)

const storage = sha3(Buffer.from(key, 'hex'))

console.log(storage.toString('hex'))
