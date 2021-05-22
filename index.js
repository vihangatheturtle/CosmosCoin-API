const express = require('express');
const { v4: uuidv4 } = require('uuid');
const SHA256 = require('crypto-js/sha256');
const packageData = require('./package.json');

const app = express();
const port = 31823;

var nodeData = {};

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

app.post('/nodes/register-new-node', function(req, res) {
	var uuid = uuidv4();
	var mnspl = splHalf(req.headers["machinename"]);
	req.headers["machinename"] = "csms" + makeid(8) + mnspl[0] + makeid(8) + mnspl[1] + makeid(8) + "node";
	try {
		nodeData[uuid] = {"machineName":req.headers["machinename"],"uuid":uuid};
	} catch {
		res.json({"error":true,"message":"Invalid machinename"});
		return;
	}
	res.json({"error":false,"message":nodeData[uuid]});
});

app.get('/nodes/node-list', function(req, res) {
	res.send(nodeData);
});

app.get('/', function(req, res) {
	res.send(`CosmosCoin Official API, version ${packageData["version"]}`);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})