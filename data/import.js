const Database = require('@replit/database');
const fs = require('fs');

const db = new Database();

console.log("Clearning old db");
db.list().then(async db_list => {
	for (let i in db_list) {
		await db.delete(db_list[i]);
		await console.log("Deleted key " + db_list[i])
	}
	await console.log("Deleting completed")
})

setTimeout(importNew, 100); //required cuz async is a bitch and keys would get deleted after getting set. dumb but works

async function importNew() {
	fs.readFile('in.json', async (err, data) => {
    	if (err) throw err;
    	let content = JSON.parse(data);
		let keys = Object.keys(content)
		for (let i in keys) {
			await db.set(keys[i], content[keys[i]])
			await console.log("Set key " + keys[i] + " to " + content[keys[i]])
		}
	});
}

console.log("Database imported")