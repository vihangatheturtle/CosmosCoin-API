// CosmosCoin API

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const SHA256 = require('crypto-js/sha256');
const bp = require('body-parser');

const packageData = require('./package.json');
const app = express();
const port = 31823;

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

class CryptoBlock{
    constructor(index, data, precedingHash=" ", dataOverride=false){
	if (!dataOverride) {
     this.index = index;
     this.timestamp = Date.now().toString();
     this.data = data;
     this.precedingHash = precedingHash;
     this.hash = this.computeHash();
	 this.nonce = 0;
	} else {
	 this.index = data.index;
     this.timestamp = data.timestamp;
     this.data = data.data;
     this.precedingHash = data.precedingHash;
     this.hash = data.hash;
	 this.nonce = data.nonce;
	}
    }
    computeHash(){
        return SHA256(this.index + this.precedingHash + this.timestamp + JSON.stringify(this.data)+this.nonce).toString();
    }
	proofOfWork(difficulty){
		while(this.hash.substring(0, difficulty) !==Array(difficulty + 1).join("0")){
			this.nonce++;
		    this.hash = this.computeHash();
	    }
	}
}

class CryptoBlockchain{
    constructor(){
        this.blockchain = [this.startGenesisBlock()];
		this.difficulty = mineDiff;
    }
    startGenesisBlock(){
        return new CryptoBlock(0, "Initial Block in the Chain", "0");
    }
    obtainLatestBlock(){
        return this.blockchain[this.blockchain.length - 1];
    }
    addNewBlock(newBlock){
        newBlock.precedingHash = this.obtainLatestBlock().hash;
        newBlock.proofOfWork(this.difficulty);
        this.blockchain.push(newBlock);
    }
	addNewBlockRaw(newBlock){
        this.blockchain.push(newBlock);
    }
	checkChainValidity(){
        for(let i = 1; i < this.blockchain.length; i++){
            const currentBlock = this.blockchain[i];
            const precedingBlock= this.blockchain[i-1];

          if(currentBlock.hash !== currentBlock.computeHash()){
              return false;
          }
          if(currentBlock.precedingHash !== precedingBlock.hash)
            return false;
        }
        return true;
    }
}

var mineDiff = 4;
var nodeData = {};
var nodes = [];
var txNTBC = {};
var secretUsedSecretIDs = {};
var secretUsedWalletIDs = {};
var miners = {};
let CosmosCoin = new CryptoBlockchain();
let tempCoin = new CryptoBlockchain();
tempCoin.blockchain[0] = CosmosCoin.blockchain[0];

function makeid(length) {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result.push(characters.charAt(Math.floor(Math.random() * 
 charactersLength)));
   }
   return result.join('');
}

function splHalf(str) {
	let half = Math.floor(str.length / 2);
	return [str.slice(0, half), str.slice(half, str.length)]
}

app.post('/nodes/unregister-node', function(req, res) {
	try {
		var uuid = req.headers["uuid"];
		var sid = req.headers["sid"];
		var wid = req.headers["wid"];
		var type = req.headers["type"];
		var senderSign = req.headers["sendersign"];
		if (sid && uuid && senderSign && senderSign == nodeData[uuid]["senderSignExpect"] && secretUsedSecretIDs[sid] == wid &&secretUsedWalletIDs[wid] == sid && type == "wallet") {
			try {
				delete secretUsedSecretIDs[sid];
				delete secretUsedWalletIDs[sid];
				if (nodes.indexOf(uuid) > -1) {
				  nodes.splice(nodes.indexOf(uuid), 1);
				}
				res.send("unregistered");
				console.log(uuid + "::logout");
				return;
			} catch (ex) {
				console.log(ex)
				res.send("errorWhilstUnregistering");
				return;
			}
		}
		res.send('failedToUnregisterNode');
	} catch {
		res.send("errorWhilstUnregistering");
	}
});

app.post('/nodes/register-new-node', function(req, res) {
	try {
		var uuid = uuidv4();
		var mnspl = splHalf(req.headers["machinename"]);
		var sid = req.headers["sid"];
		var wid = req.headers["wid"];
		var type = req.headers["type"];
		var pwdhash = req.headers["pwdhash"];
		var loginUUID = req.headers["loginuuid"];
		var senderSign = req.headers["sendersign"];
		if (type == "miner") {
			if (wid) {
				req.headers["machinename"] = "csms" + makeid(8) + mnspl[0] + makeid(8) + mnspl[1] + makeid(8) + "node";
				try {
					miners[uuid] = {"machineName":req.headers["machinename"],"uuid":uuid,"wallet":wid};
				} catch {
					res.json({"error":true,"message":"Invalid machinename"});
					return;
				}
				res.json({"error":false,"message":miners[uuid]});
			} else {
				res.json({"error":true,"message":"Invalid WalletID"});
			}
		} else {
			if (pwdhash) {
				if (sid) {
					if (secretUsedWalletIDs[SHA256(sid).toString()] == null) {
						if (loginUUID == null) {
							cont();
						} else {
							res.json({"error":true,"message":"Not registered"});
						}
					} else {
						if (secretUsedWalletIDs[SHA256(sid).toString()] == sid) {
							if (loginUUID == null) {
								cont();
							} else {
								login();
							}
						} else {
							res.json({"error":true,"message":"Wallet already registered"});
						}
					}
					function login() {
						try {
							if (senderSign == nodeData[loginUUID]["senderSignExpect"]) {
								secretUsedSecretIDs[sid] = SHA256(sid).toString();
								secretUsedWalletIDs[SHA256(sid).toString()] = sid;
								req.headers["machinename"] = "csms" + makeid(8) + mnspl[0] + makeid(8) + mnspl[1] + makeid(8) + "node";
								try {
									delete nodeData[loginUUID];
									nodeData[uuid] = {"machineName":req.headers["machinename"],"uuid":uuid,"wallet":SHA256(sid).toString(),"senderSignExpect":SHA256(sid + uuid + secretUsedSecretIDs[sid] + pwdhash).toString()};
									try {
										if (nodes.indexOf(loginUUID) > -1) {
										  nodes.splice(nodes.indexOf(loginUUID), 1);
										}
									} catch { }
									nodes.push(uuid);
								} catch {
									res.json({"error":true,"message":"Invalid machinename"});
									return;
								}
								res.json({"error":false,"message":nodeData[uuid]});
								console.log(loginUUID + "::login");
							} else {
								res.json({"error":true,"message":"Invalid senderSign"});
								return;
							}
						} catch {
							res.json({"error":true,"message":"Invalid senderSign"});
						}
					}
					function cont() {
						secretUsedSecretIDs[sid] = SHA256(sid).toString();
						secretUsedWalletIDs[SHA256(sid).toString()] = sid;
						req.headers["machinename"] = "csms" + makeid(8) + mnspl[0] + makeid(8) + mnspl[1] + makeid(8) + "node";
						try {
							nodeData[uuid] = {"machineName":req.headers["machinename"],"uuid":uuid,"wallet":SHA256(sid).toString(),"senderSignExpect":SHA256(sid + uuid + secretUsedSecretIDs[sid] + pwdhash).toString()};
							nodes.push(uuid);
						} catch {
							res.json({"error":true,"message":"Invalid machinename"});
							return;
						}
						res.json({"error":false,"message":nodeData[uuid]});
						console.log(uuid + "::register");
					}
				} else {
					res.json({"error":true,"message":"Invalid SecretID"});
				}
			} else {
				res.json({"error":true,"message":"Invalid pwdhash"});
			}
		}
	} catch (ex) {
		console.log(ex);
		res.json({"error":true,"message":"An unknown error occurred"});
	}
});

var blckMine = false;

app.post('/tx/transactions', function(req, res) {
	var machineUUID = req.headers["uuid"];
	var sid = req.headers["sid"];
	var senderSign = req.headers["sendersign"];
	if (sid) {
		if (secretUsedSecretIDs[sid]) {
			if (req.headers["from"]) {
				if (secretUsedSecretIDs[sid] == req.headers["from"]) {
					if (senderSign) {
						if (senderSign == nodeData[machineUUID]["senderSignExpect"]) {
							procTransaction();
						} else {
							res.send("senderSignInvalid");
							return;
						}
					} else {
						res.send("senderSignNotProvided");
						return;
					}
				} else {
					res.send("widInvalid");
					return;
				}
			} else {
				res.send("widNotProvided");
				return;
			}
		} else {
			res.send("sidInvalid");
			return;
		}
	} else {
		res.send("sidNotProvided");
		return;
	}
	function procTransaction() {
		if (machineUUID) {
			try {
				var txID = uuidv4();
				var from = req.headers["from"];
				var to = req.headers["to"];
				var price = req.headers["price"];
				if (price == null) {
					res.send("invalidBodyMissingPrice");
					return;
				}
				if (to == null) {
					res.send("invalidBodyMissingTo");
					return;
				}
				if (from == null) {
					res.send("invalidBodyMissingFrom");
					return;
				}
				var time = Date.now().toString();
				var hash = SHA256(to + from + txID + price + senderSign).toString();
				txNTBC[txID] = {"txBody":{"txFrom":from,"txTo":to,"txPrice":price},"txID":txID,"txTicks":Date.now().toString(),"txHash":hash,"senderUUID":machineUUID,"senderSign":SHA256(senderSign).toString()};
				res.send(txNTBC[txID]);
			} catch (ex) {
				console.log(ex);
				res.send('err');
			}
		} else {
			res.send('noUUIDProvided');
			return;
		}
	}
});

app.get('/tx/transactions', function(req, res) {
	res.send(JSON.stringify(txNTBC));
});

app.post('/mine/publish/block', function(req, res) {
	var machineUUID = req.headers["uuid"];
	var senderUUID = req.headers["senderuuid"];
	var senderSign = req.headers["sendersignpassthrough"];
	var txIDTransaction = null;
	if (req.headers["txid"] == null) {
		res.send('noTxIDProvided');
		return;
	} else {
		try {
			if (txNTBC[req.headers["txid"]] == null) {
				res.send('invalidTxID');
				return;
			} else if (txNTBC[req.headers["txid"]]["txHash"] != req.headers["txhash"]) {
				res.send('invalidTxHash');
				return;
			} else {
				txIDTransaction = txNTBC[req.headers["txid"]]["txID"];
			}
		} catch (ex) {
			console.log(ex);
			res.send('invalidTxID');
			return;
		}
	}
	if (req.headers["uuid"] == null) {
		res.send('noUUIDProvided');
		return;
	}
	if (miners[machineUUID]) {
		if (!blckMine) {
			if (senderSign == SHA256(nodeData[senderUUID]["senderSignExpect"]).toString()) {
				blckMine = true;
				tempCoin.addNewBlockRaw(new CryptoBlock(tempCoin.blockchain.length, req.body, req.body["precedingHash"], true));
				if (!tempCoin.checkChainValidity()) {
					tempCoin = new CryptoBlockchain();
					for (i=0; i<CosmosCoin.blockchain.length; i++) {
						tempCoin.blockchain[i] = CosmosCoin.blockchain[i];
					}
					res.send('invalidBlock');
				} else {
					CosmosCoin.addNewBlockRaw(new CryptoBlock(CosmosCoin.blockchain.length, req.body, req.body["precedingHash"], true));
					delete txNTBC[req.headers["txid"]];
					if (CosmosCoin.checkChainValidity()) {
						console.log("[blockchain] +block:" + txIDTransaction + ":" + miners[machineUUID]["machineName"]);
						res.send('validBlock');
					}
				}
				blckMine = false;
			} else {
				res.send('senderSignInvalid');
			}
		} else {
			res.send('blockInProcess');
		}
		return;
	} else {
		res.send('invalidUUID');
		return;
	}
});

app.get('/mine/genesis', function(req, res) {
	res.send(JSON.stringify(CosmosCoin["blockchain"][0]));
});

app.get('/mine/bchain', function(req, res) {
	function reply() {
		setTimeout(() => {
			if (!blckMine) {
				res.send(JSON.stringify(CosmosCoin, null, 4));
				return;
			} else {
				reply();
			}
		}, 500);
	}
	
	reply();
});

app.get('/mine/diff', function(req, res) {
	res.send(mineDiff.toString());
});

app.get('/nodes/node-list', function(req, res) {
	res.send(nodes);
});

app.get('/', function(req, res) {
	res.send(`CosmosCoin Official API, version ${packageData["version"]}`);
});

app.listen(port, () => {
  console.log(`CosmosCoin API server listening at http://localhost:${port}`)
})
