const sha256 = require("crypto-js/sha256");
const ecLib = require('elliptic').ec;
const ec = new ecLib('secp256k1')
const { Transaction, Chain, Block } = require("./main.js");

//创建区块链 默认难度为3
const myChain = new Chain()
//创建3个账户 3个key
const Alicekey = ec.genKeyPair();
const Bobkey = ec.genKeyPair();
const Catkey = ec.genKeyPair();
const AlicePubKey = Alicekey.getPublic('hex')
const BobPubKey = Bobkey.getPublic('hex')
const CatPubKey = Catkey.getPublic('hex')
//创建账户
myChain.createAcountWithPublicKey(AlicePubKey, BobPubKey, CatPubKey)
// 第一次挖矿
myChain.mineTransactionPool(AlicePubKey)
// 获取A上一次交易记录
const aTxIn = myChain.getAddressTxIn(AlicePubKey)
// A转账给Bs
const msg = sha256(aTxIn[2]).toString()
const sign = Alicekey.sign(msg, 'base64').toDER('hex')
const t1 = new Transaction(aTxIn[0], aTxIn[1], sign, BobPubKey, 20)
// 验证是否正确
t1.isSignValid(AlicePubKey,msg)
myChain.addTransaction(t1)
//第二次挖矿
myChain.mineTransactionPool(CatPubKey)
//查看区块链
// console.log(myChain)

let str = JSON.stringify(myChain.chain[myChain.chain.length-1])
console.log(JSON.parse(str))

// const t1 = new Transaction('addr1', 'addr2', 10)
// const t2 = new Transaction('addr2', 'addr1', 5)
// myChain.addTransaction(t1)
// myChain.addTransaction(t2)
// myChain.mineTransactionPool('addr3')
// const t3 = new Transaction('addr3', 'addr2', 20)
// myChain.addTransaction(t3)
// myChain.mineTransactionPool('addr2')
// const t4 = new Transaction('addr2', 'addr1', 20)
// myChain.addTransaction(t4)
// myChain.mineTransactionPool('addr3')
// const t5 = new Transaction('addr2', 'addr1', 2)
// myChain.addTransaction(t5)
// myChain.mineTransactionPool('addr1')

// console.log(myChain.doneTransactionRecords);

// const block1 = new Block("转账10元", "")
// myChain.addBlockToChain(block1)
// const block2 = new Block("转账50元", "")
// myChain.addBlockToChain(block2)
// 尝试串改区块
// myChain.chain[1].data='转账100元'
// myChain.chain[1].mine(4)
// console.log(myChain)
// console.log(myChain.validateChain());
