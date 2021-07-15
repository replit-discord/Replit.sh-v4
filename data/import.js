const Database = require('@replit/database');
const fs = require('fs');

const db = new Database();

console.log("Clearning old db");
db.list().then(db_list => {
	for (let i in db_list) {
		db.delete(db_list[i]);
		console.log("Deleted key " + db_list[i])
	}
})

fs.readFile('in.json', (err, data) => {
    if (err) throw err;
    let content = JSON.parse(data);
	console.log(content)
	let keys = Object.keys(content)
	for (let i in keys) {
		db.set(keys[i], content[keys[i]])
		console.log("Set key " + keys[i] + " to " + content[keys[i]])
	}
});

console.log("Database imported")
/*

for x in db.list():
	console.log("Cleared key " + str(x))
	del db[x]
console.log("Opening JSON File")
with open("in.json", "r") as read_file:
	console.log("Converting JSON encoded data into Python dictionary")
	indb = json.load(read_file)
console.log("Starting DB Import...")
for key, value in indb.items():
	print ("Set key " + str(key) + " to " + str(value))
	db[key] = value
console.log("Database imported")*/