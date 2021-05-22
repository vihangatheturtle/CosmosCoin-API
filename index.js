const express = require('express');
const { v4: uuidv4 } = require('uuid');
const packageData = require('./package.json');

const app = express();
const port = 31823;

var nodeData = {};

app.post('/node/register-new-node', function(req, res) {
	var uuid = uuidv4();
	req.headers["machinename"] = "csms" + req.headers["machinename"] + 
	try {
		nodeData[uuid] = {"machineName":req.headers["machinename"],"uuid":uuid};
	}
	catch {
		res.json({"error":true,"message":"Invalid machinename"});
		return;
	}
	res.json({"error":false,"message":nodeData[uuid]});
});

app.get('/', function(req, res) {
	res.send(`CosmosCoin Official API, version ${packageData["version"]}`);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})