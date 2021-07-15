const Database = require('@replit/database');
const fs = require("fs");

const db = new Database();

let outdb = {}

console.log("Starting DB Export...")
db.list().then(async db_list => {
	for (let i in db_list) {
		let value = await db.get(db_list[i]);
		outdb[db_list[i]] = value;
		console.log("Set key " + db_list[i] + " to " + value)
	}

	let data = JSON.stringify(outdb);
	fs.writeFileSync('out.json', data);

})

/*
from replit import db



for x in list(db.keys()):
	
	outdb[x] = db[x]
f = open('out.json', 'w')
with open('out.json', 'w') as outfile:
	console.log("File opened...")
	json.dump(outdb, outfile)
	console.log("File written...")
	console.log("File closed...")
*/