## A simple blockchain application

基于nodejs和websocket实现的简单区块链。

### run test 运行测试
```
npm install
npm start
```
将会运行`src/test.js`。 

```javascript
//创建区块链 create blockchain
const myChain = new Chain()
//创建3个账户 create 3 acount
const Alicekey = ec.genKeyPair();
const Bobkey = ec.genKeyPair();
const Catkey = ec.genKeyPair();
const AlicePubKey = Alicekey.getPublic('hex')
const BobPubKey = Bobkey.getPublic('hex')
const CatPubKey = Catkey.getPublic('hex')
myChain.createAcountWithPublicKey(AlicePubKey, BobPubKey, CatPubKey)
// 第一次挖矿 first mining
myChain.mineTransactionPool(AlicePubKey)
// 获取A上一次交易记录 get last transaction info
const aTxIn = myChain.getAddressTxIn(AlicePubKey)
// A转账给B alice transfer to bob
const msg = sha256(aTxIn[2]).toString()
const sign = Alicekey.sign(msg, 'base64').toDER('hex')
const t1 = new Transaction(aTxIn[0], aTxIn[1], sign, BobPubKey, 20)
// 验证是否正确 verify sign
t1.isSignValid(AlicePubKey,msg)
myChain.addTransaction(t1)
//第二次挖矿 second mining
myChain.mineTransactionPool(CatPubKey)
//查看区块链 check current blockchain
console.log(myChain)
```

### 运行本地服务器 Local Server
```
cd /src
node server.js
```
然后打开多个`index.html`体验挖完区块广播的功能。 Open multiple html page to experience boardcast.

### 代码解释 Code

区块 Block
```javascript
constructor(transactions, previousHash) {
        this.index = 0
        this.transactions = transactions
        this.timestamp = Date.now() // 发现的时间
        this.previousHash = previousHash // 前一个hash
        this.hash = this.computeHash() // 当前hash
        this.nonce = 0 // 影响mining的干扰值
        this.difficulty = 3; // 初始难度
    }
```

链 Chain
```javascript
constructor() {
        this.chain = [this.firstBlock()];
        this.transactionPool = []; // 待挖交易
        this.minerReward = 100; // 挖币奖励
        this.previousAdjustmentBlockIndex = 1; //上一个调整难度的区块
        this.difficultyAdjustmentInterval = 2; // 隔多少个区块调整一次难度
        this.blockGenerationInterval = 1500; // 区块生成间隔
        this.doneTransactionRecords = []; // 历史交易池
    }
```

交易 Transaction
```javascript
constructor(preid, preindex, signature, toAdd, amount) {
        this.preid = preid; // 上一个交易的id Last transaction id
        this.preindex = preindex; // 上一个交易的index Last index
        this.signature = signature; 
        this.toAdd = toAdd; // 发币去哪 to which address
        this.amount = amount; // 金额
        this.id = this.computeHashId() //这个交易的hash
    }
```

实现了基础区块链的功能 Basic functions include

* 挖矿 mining
 ```javascript
 mineTransactionPool(minerRewardAddress) {
        // transaction with miner rewards from system
        const minerRewardTransaction = new Transaction('', '', 'minerReward', minerRewardAddress, this.minerReward);
        // push to transaction pool and the historical transaction pool
        this.transactionPool.push(minerRewardTransaction);
        this.doneTransactionRecords.push(minerRewardTransaction);
        const newBlock = new Block(this.transactionPool, this.getLastBlock().hash);
        newBlock.index = this.getLastBlock().index + 1
        // adjust difficullty
        const adjustedDifficulty = this.getDifficulty(newBlock)
        newBlock.difficulty = adjustedDifficulty;
        // start mine , use POW to find the hash value of block
        newBlock.mine(adjustedDifficulty);
        // add to the main chain
        this.chain.push(newBlock);
        this.transactionPool = [];
    }
 ```
* 交易 transaction

* 交易签名 signature

> 使用了`elliptic`进行签名

* 自动调整难度 adjust difficulty
```javascript
getAdjustedDifficulty(curBlock, previousBlockIndex) {
        // get the previous block info
        const previousBlock = this.chain[previousBlockIndex];
        // calculate time expected and time taken
        const timeExpected = this.difficultyAdjustmentInterval * this.blockGenerationInterval;
        const timeTaken = curBlock.timestamp - previousBlock.timestamp;
        // adjusted difficulties
        if (timeTaken < timeExpected / 2) {
            this.previousAdjustmentBlockIndex = curBlock.index
            curBlock.difficulty = previousBlock.difficulty + 1;
            return curBlock.difficulty
        } else if (timeTaken > timeExpected * 2) {
            this.previousAdjustmentBlockIndex = curBlock.index;
            if (previousBlock.difficulty == 1) {
                curBlock.difficulty = previousBlock.difficulty;
            } else {
                curBlock.difficulty = previousBlock.difficulty - 1;
            }
            return curBlock.difficulty
        } else {
            this.previousAdjustmentBlockIndex = curBlock.index;
            curBlock.difficulty = previousBlock.difficulty;
            return curBlock.difficulty
        }
    }
```
* 挖矿广播 mining boardcast
```javascript
function boardcast() {
    // boardcast via websocket
    server.connections.forEach(function (conn) {
        let jsonstr = JSON.stringify(myChain.chain[myChain.chain.length - 1], null, 2);
        conn.sendText(jsonstr);
    })
}
```

### 参考大佬 Reference
[luotuochain](https://github.com/ycraaron/LuotuoCoin)

### 存在问题 Problem

无法得到账户余额，可以无限透支。 Can not check the account balance.