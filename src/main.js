const sha256 = require("crypto-js/sha256");
const ecLib = require('elliptic').ec;
const ec = new ecLib('secp256k1')

class Transaction {
    //要有签名和公钥
    //公钥就是地址
    //交易包含id TxIn TxOut
    //id是里面交易内容的合并之后的hash
    //TxIn要有之前交易的id 之前交易的index 和签名
    //签名包含上一次的金额
    //TxOut要有目标地址也就是接收人的公钥 还要币的数量
    //初始50金币
    constructor(preid, preindex, signature, toAdd, amount) {
        this.preid = preid;
        this.preindex = preindex;
        this.signature = signature;
        this.toAdd = toAdd;
        this.amount = amount;
        this.id = this.computeHashId()
    }

    //计算出交易id
    computeHashId() {
        return sha256(this.preid + this.preindex + this.toAdd + this.amount).toString()
    }

    //验证签名是否正确
    isSignValid(pbkey, doc) {
        const publicKey = ec.keyFromPublic(pbkey, 'hex')
        console.log("验证签名为： " + publicKey.verify(doc, this.signature));
        return publicKey.verify(doc, this.signature);
    }
}

class Block {
    constructor(transactions, previousHash) {
        this.index = 0
        this.transactions = transactions
        this.timestamp = Date.now()
        this.previousHash = previousHash
        this.hash = this.computeHash()
        this.nonce = 0
        this.difficulty = 3;
    }

    //计算Hash
    computeHash() {
        return sha256(this.index + this.previousHash + this.nonce + this.timestamp + JSON.stringify(this.transactions)).toString()
    }

    //开头前n位为0的hash
    getAnswer(difficulty) {
        return '0'.repeat(difficulty)
    }


    //计算符合区块链难度要求的hash
    mine(difficulty) {
        while (true) {
            this.hash = this.computeHash();
            if (this.hash.substring(0, difficulty) !== this.getAnswer(difficulty)) {
                this.nonce++;
                continue
            } else {
                break
            }
        }
        console.log("挖矿结束 " + this.hash);
    }
}

class Chain {
    constructor() {
        this.chain = [this.firstBlock()];
        //待挖交易
        this.transactionPool = [];
        this.minerReward = 100;
        this.previousAdjustmentBlockIndex = 1;
        this.difficultyAdjustmentInterval = 2;
        this.blockGenerationInterval = 1500;
        //历史交易池
        this.doneTransactionRecords = [];
    }

    //创建账户 初始金额50元
    createAcountWithPublicKey(...args) {
        let result = [...args];
        for (const addr of result) {
            const initTransaction = new Transaction('', '', 'system', addr, 50);
            this.addTransaction(initTransaction)
        }
    }

    //得到TxIn的 preid， preindex，
    getAddressTxIn(address) {
        let preId = 0
        let preIndex = 0
        let preAmount = 0
        for (let i = this.doneTransactionRecords.length - 1; i >= 0; i--) {
            if (this.doneTransactionRecords[i].toAdd === address) {
                const record = this.doneTransactionRecords[i];
                preId = record.id;
                preIndex = i;
                preAmount = record.amount;
                return [preId, preIndex, preAmount]
            }
        }
        throw Error("找不到之前有这个地址的记录")
    }

    //第一个区块
    firstBlock() {
        const genesisBlock = new Block('我是祖先', '')
        return genesisBlock
    }

    //获得上一个block
    getLastBlock() {
        return this.chain[this.chain.length - 1]
    }

    //添加transaction 到transationPool里
    addTransaction(transaction) {
        this.transactionPool.push(transaction)
        this.doneTransactionRecords.push(transaction)
    }

    //获取难度 difficultyAdjustmentInterval个区块更改一次
    getDifficulty(curBlock) {
        const curIndex = curBlock.index;
        console.log("现在是第几个block: " + curIndex);
        const previousBlock = this.chain[curIndex - 1]
        if (curIndex % this.difficultyAdjustmentInterval === 0 && curIndex != 0) {
            console.log("进行修改难度")
            return this.getAdjustedDifficulty(curBlock, this.previousAdjustmentBlockIndex)
        } else {
            console.log("没有修改难度");
            console.log("上一个区块是 ：" + previousBlock.index);
            console.log("当前区块难度： " + previousBlock.difficulty)
            return previousBlock.difficulty
        }
    }

    //根据时间的对比调整难度
    getAdjustedDifficulty(curBlock, previousBlockIndex) {
        const previousBlock = this.chain[previousBlockIndex];
        console.log("上一个修改的区块： " + previousBlock.index);
        const timeExpected = this.difficultyAdjustmentInterval * this.blockGenerationInterval;
        const timeTaken = curBlock.timestamp - previousBlock.timestamp;
        console.log("消耗时间预期： " + timeExpected);
        console.log("实际时间消耗： " + timeTaken);
        if (timeTaken < timeExpected / 2) {
            this.previousAdjustmentBlockIndex = curBlock.index
            curBlock.difficulty = previousBlock.difficulty + 1;
            console.log("当前难度： " + curBlock.difficulty);
            return curBlock.difficulty
        } else if (timeTaken > timeExpected * 2) {
            this.previousAdjustmentBlockIndex = curBlock.index;
            if (previousBlock.difficulty == 1) {
                curBlock.difficulty = previousBlock.difficulty;
            } else {
                curBlock.difficulty = previousBlock.difficulty - 1;
            }
            console.log("当前难度： " + curBlock.difficulty);
            return curBlock.difficulty
        } else {
            this.previousAdjustmentBlockIndex = curBlock.index;
            curBlock.difficulty = previousBlock.difficulty;
            console.log("当前难度： " + curBlock.difficulty);
            return curBlock.difficulty
        }
    }

    //发放矿工奖励
    mineTransactionPool(minerRewardAddress) {
        // 发放矿工奖励
        const minerRewardTransaction = new Transaction('', '', 'minerReward', minerRewardAddress, this.minerReward);
        // 上传交易到交易池和历史交易池
        this.transactionPool.push(minerRewardTransaction);
        this.doneTransactionRecords.push(minerRewardTransaction);
        const newBlock = new Block(this.transactionPool, this.getLastBlock().hash);
        newBlock.index = this.getLastBlock().index + 1
        //获取难度
        const adjustedDifficulty = this.getDifficulty(newBlock)
        newBlock.difficulty = adjustedDifficulty;
        // 挖矿
        newBlock.mine(adjustedDifficulty);
        this.chain.push(newBlock);
        this.transactionPool = [];
    }

    //验证当前区块链是否合法
    validateChain() {
        if (this.chain.length === 1) {
            if (this.chain[0].hash !== this.chain[0].computeHash()) {
                return false
            }
            return true
        }
        for (let i = 1; i < this.chain.length; i++) {
            const blockToValidate = this.chain[i]
            if (blockToValidate.hash !== blockToValidate.computeHash()) {
                console.log("数据篡改");
                return false
            }
            const previousBlock = this.chain[i - 1]
            if (previousBlock.hash !== blockToValidate.previousHash) {
                console.log("前后区块链接断裂");
                return false
            }
            if (previousBlock.index !== blockToValidate.index - 1) {
                console.log("index不对");
                return false
            }
        }
        return ("区块合法！")
    }
}

module.exports = { Chain, Transaction, Block }
