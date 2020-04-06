// 把test.js放进来
const sha256 = require("crypto-js/sha256");
const ecLib = require('elliptic').ec;
const ec = new ecLib('secp256k1')
const { Transaction, Chain, Block } = require("./main.js");

var ws = require("nodejs-websocket");

var server = ws.createServer(function (conn) {
    console.log('New Connection');

    conn.on('text', function (str) {
        // console.log(str);
        if (str == 'a') {
            let jsonstr = JSON.stringify(myChain.chain[myChain.chain.length - 1], null, 2);
            conn.sendText(jsonstr);
        } else if (str == 'b') {
            myChain.mineTransactionPool(AlicePubKey)
            boardcast();
        } else if (str == 'c') {
            myChain.mineTransactionPool(BobPubKey)
            boardcast();
        } else if (str == 'd') {
            myChain.mineTransactionPool(CatPubKey)
            boardcast();
        } else {
            assignTransfer(str)
        }
    });
    // setTimeout(function(){
    //     conn.sendText('来自服务端的消息');
    // },5000)

    conn.on('error', function (err) {
        console.log(err);
    })
}).listen(2333);

function boardcast() {
    // myChain.mineTransactionPool(AlicePubKey)
    server.connections.forEach(function (conn) {
        let jsonstr = JSON.stringify(myChain.chain[myChain.chain.length - 1], null, 2);
        conn.sendText(jsonstr);
    })
}

function assignTransfer(str){
    let arr = str.split('#');
    let sender;
    let sign, msg, aTxIn;
    if(arr[0]=='A'){
        sender = AlicePubKey;
        aTxIn = myChain.getAddressTxIn(sender);
        msg = sha256(aTxIn[2]).toString();
        sign = Alicekey.sign(msg, 'base64').toDER('hex');
    }else if(arr[0]=='B'){
        sender = BobPubKey;
        aTxIn = myChain.getAddressTxIn(sender);
        msg = sha256(aTxIn[2]).toString();
        sign = Bobkey.sign(msg, 'base64').toDER('hex');
    }else if(arr[0]=='C'){
        sender = CatPubKey;
        aTxIn = myChain.getAddressTxIn(sender);
        msg = sha256(aTxIn[2]).toString();
        sign = Catkey.sign(msg, 'base64').toDER('hex');
    }
    let receiver = ''
    if(arr[2]=='A'){
        receiver = AlicePubKey;
    }else if(arr[2]=='B'){
        receiver = BobPubKey;
    }else if(arr[2]=='C'){
        receiver = CatPubKey;
    }
    const t1 = new Transaction(aTxIn[0], aTxIn[1], sign ,receiver, arr[1]);
    // 验证签名正确才发送
    if(t1.isSignValid(sender, msg)&&aTxIn[2]>arr[1]){
        console.log('你的账户有足够的钱，交易成功')
        myChain.addTransaction(t1)
    }else{
        console.log('你没有那么多钱，交易失败');
    }
}






// 把test.js放进来
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
// // 获取A上一次交易记录
// const aTxIn = myChain.getAddressTxIn(AlicePubKey)
// // A转账给Bs
// const msg = sha256(aTxIn[2]).toString()
// const sign = Alicekey.sign(msg, 'base64').toDER('hex')
// const t1 = new Transaction(aTxIn[0], aTxIn[1], sign, BobPubKey, 20)
// // 验证是否正确
// t1.isSignValid(AlicePubKey, msg)
// myChain.addTransaction(t1)
// //第二次挖矿
// myChain.mineTransactionPool(CatPubKey)
//查看区块链
// console.log(myChain)
