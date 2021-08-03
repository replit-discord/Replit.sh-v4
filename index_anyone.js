const express = require('express');
const Database = require('@replit/database');
const fs = require('fs');
const ejs = require('ejs');
const uuid = require("uuid");
const ogs = require('open-graph-scraper');
const bent = require('bent')
const crypto = require('crypto');
const log = require('fancy-log');

const app = express();
const db = new Database();

const siteName = "\\ (•◡•) /";
const siteURL = "https://replit.sh"
const regex = new RegExp('^https:\/\/replit.com\/@([^\/#\?]+?)(?:\/([^\/#\?]+?))[\/#\?]?$');
const getJSON = bent('json')

app.use(express.urlencoded({
	extended: true
}))

const users = JSON.parse(process.env.IDS)

app.get('/', async (req, res) => {
	try {
		let user_id = req.headers['x-replit-user-id']
		let user_name = req.headers['x-replit-user-name']
		if (req.headers['x-replit-user-id'].length > 0) {
			let matches = await db.list("user_id");
			if (matches.indexOf(`user_id_${user_id}`) == -1) {
				await db.set(`user_id_${user_id}`, {});
			};
			let urls = await db.get(`user_id_${user_id}`);
			let out_list = {};
			for (let i in urls) {
				let value = await db.get(urls[i]);
				out_list[urls[i]] = value;
			}
			let view_name = 'dashboard.html'
			let json = {
				siteName: siteName,
				user_id: user_id,
				user_name: user_name,
				siteUrl: siteURL,
				user_urls: urls,
				urls_with_keys: out_list,
				error: ""
			}
			log(`Dashboard - Returned ${view_name}`)
			fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
		}
		let view_name = 'index.html'
		let json = {
			siteName: siteName,
			user_id: user_id,
			user_name: user_name,
			siteUrl: siteURL,
			error: ""
		}
		log(`Login - Returned ${view_name}`)
		fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
	} catch (err) {
		let view_name = 'error.html'
		let json = {
			siteName: siteName,
			siteUrl: siteURL,
			code: '401',
			message: "You aren't an allowed user, sorry!"
		};
		log.error("Error! Sent 401")
		fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
	}
});

app.get('/new', async (req, res) => {
	try {
		let user_id = req.headers['x-replit-user-id']
		let user_name = req.headers['x-replit-user-name']
		if (req.headers['x-replit-user-id'].length > 0) {
			let view_name = 'submit.html'
			let json = {
				siteName: siteName,
				user_id: user_id,
				user_name: user_name,
				siteUrl: siteURL,
				error: ""
			}
			log(`New URL - Returned ${view_name}`)
			fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
		} else {
			res.redirect('/');
		}
	} catch (err) {
		let view_name = 'error.html'
		let json = {
			siteName: siteName,
			siteUrl: siteURL,
			code: '401',
			message: "You aren't an allowed user, sorry!"
		};
		log.error("Error! Sent 401")
		fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
	}
});
app.post('/new', async (req, res) => {
	try {
		let user_id = req.headers['x-replit-user-id']
		let user_name = req.headers['x-replit-user-name']
		if (req.headers['x-replit-user-id'].length > 0) {
			var id = "";
			if (req.body.key.length == 0) {
				id = uuid.v4().substring(0, 8);
				db.list("short_url_").then(matches => {
					while (matches.includes("short_url_" + id)) {
						id = uuid.v4().substring(0, 8);
					}
				});
			} else {
				id = req.body.key;
				await db.list("short_url_").then(matches => {
					if (matches.includes("short_url_" + id)) {
						let view_name = 'submit.html'
						let json = {
							siteName: siteName,
							user_id: user_id,
							user_name: user_name,
							siteUrl: siteURL,
							error: "That ID already exists. Please try again."
						}
						log.warn(`URL Already Exists - Returned ${view_name}`)
						fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
					}
				})
			}
			await db.set("short_url_" + id, req.body.url).then(() => {
				db.get(`user_id_${user_id}`).then(user_urls => {
					user_urls[id] = req.body.url;
					db.set(`user_id_${user_id}`, user_urls);
				});
			});
			let view_name = 'done.html'
			let json = {
				siteName: siteName,
				user_id: user_id,
				user_name: user_name,
				siteUrl: siteURL,
				newUrl: siteURL + '/' + id,
				error: ""
			}
			if (req.body.url.startsWith("https://replit.com/") && regex.test(req.body.url)) {
				ogs({ url: req.body.url, ogImageFallback: false }).then((data) => {
					let { error, result, response } = data;
					let username = req.body.url.substring(20, req.body.url.indexOf('/', 20));
					let slug = req.body.url.substring(req.body.url.indexOf(username) + username.length + 1, req.body.url.length);
					getJSON(`https://replit.com/data/repls/@${username}/${slug}`).then(replit_json => {
						let social_media_objet = {}
						social_media_objet['name'] = data.result.ogTitle;
						social_media_objet['desc'] = data.result.ogDescription;
						social_media_objet['lang'] = replit_json.language;
						social_media_objet['img'] = data.result.ogImage.url;
						db.set(`social_media_${id}`, social_media_objet)
					})
				})
			}
			log(`New URL Created - Returned ${view_name}`)
			fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
		} else {
			res.redirect('/');
		}
	} catch (err) {
		let view_name = 'error.html'
		let json = {
			siteName: siteName,
			siteUrl: siteURL,
			code: '401',
			message: "You aren't an allowed user, sorry!"
		};
		log.error("Error! Sent 401")
		fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
	}
});

app.get('/edit/:id', async (req, res) => {
	try {
		let user_id = req.headers['x-replit-user-id']
		let user_name = req.headers['x-replit-user-name']
		if (req.headers['x-replit-user-id'].length > 0) {
			let view_name = 'edit.html'
			let json = {
				siteName: siteName,
				user_id: user_id,
				user_name: user_name,
				siteUrl: siteURL,
				current_url: await db.get('short_url_' + req.params.id),
				current_key: req.params.id,
				error: ""
			}
			log(`New URL Created - Returned ${view_name}`)
			fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
		} else {
			
			res.redirect('/');
		}
	} catch (err) {
		let view_name = 'error.html'
		let json = {
			siteName: siteName,
			siteUrl: siteURL,
			code: '400',
			message: "That URL id doesn't exist, sorry!"
		};
		log.error("Error! Sent 400")
		fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
	}
});

app.post('/edit', async (req, res) => {
	try {
		let user_id = req.headers['x-replit-user-id']
		let user_name = req.headers['x-replit-user-name']
		if (req.headers['x-replit-user-id'].length > 0) {
			id = req.body.key;
			await db.list("short_url_").then(matches => {
				if (matches.includes("short_url_" + id)) {
					db.get(`user_id_${user_id}`).then(user_urls => {
						if (Object.keys(user_urls).includes(id)) {
							db.set("short_url_" + id, req.body.url).then(() => {
								db.get(`user_id_${user_id}`).then(user_urls => {
									user_urls[id] = req.body.url;
									db.set(`user_id_${user_id}`, user_urls);
									let view_name = 'done.html'
								let json = {
									siteName: siteName,
									user_id: user_id,
									user_name: user_name,
									siteUrl: siteURL,
									newUrl: siteURL + '/' + id,
									error: ""
								}
								log(`Returned ${view_name}`)
								fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
								});
							});
						} else {
							let view_name = 'error.html'
							let json = {
								siteName: siteName,
								siteUrl: siteURL,
								code: '400',
								message: "That URL isn't urs >:("
							};
							log(`Returned ${view_name}`)
							fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
						}
					})
				} else {
					let view_name = 'error.html'
					let json = {
						siteName: siteName,
						siteUrl: siteURL,
						code: '400',
						message: "That URL doesn't exist"
					};
					log(`Returned ${view_name}`)
					fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
				}
			})
		} else {
			res.redirect('/');
		}
	} catch (err) {
		let view_name = 'error.html'
		let json = {
			siteName: siteName,
			siteUrl: siteURL,
			code: '401',
			message: "You aren't an allowed user, sorry!"
		};
		log.error("Error! Sent 401")
		fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
	}
});

app.get('/delete/:id', async (req, res) => {
	try {
		let id = req.params.id.replace('short_url_', '')
		let user_id = req.headers['x-replit-user-id']
		let user_name = req.headers['x-replit-user-name']
		if (req.headers['x-replit-user-id'].length > 0) {
			let view_name = 'delete.html'
			let json = {
				siteName: siteName,
				user_id: user_id,
				user_name: user_name,
				siteUrl: siteURL,
				current_url: await db.get('short_url_' + id),
				current_key: id,
				error: ""
			}
			log(`Returned ${view_name}`)
			fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
		} else {
			res.redirect('/');
		}
	} catch (err) {
		let view_name = 'error.html'
		let json = {
			siteName: siteName,
			siteUrl: siteURL,
			code: '400',
			message: "That URL id doesn't exist, sorry!"
		};
		log.error("Error! Sent 400")
		fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
	}
});

app.post('/delete', async (req, res) => {
	try {
		let user_id = req.headers['x-replit-user-id']
		let user_name = req.headers['x-replit-user-name']
		if (req.headers['x-replit-user-id'].length > 0) {
			id = req.body.key;
			await db.list("short_url_").then(matches => {
				if (matches.includes("short_url_" + id)) {
					db.get(`user_id_${user_id}`).then(user_urls => {
						if (Object.keys(user_urls).includes(id)) {
							db.delete("short_url_" + id, req.body.url).then(() => {
								db.get(`user_id_${user_id}`).then(user_urls => {
									delete user_urls[id];
									db.set(`user_id_${user_id}`, user_urls);
									res.redirect('/');
								});
							});
						} else {
							let view_name = 'error.html'
							let json = {
								siteName: siteName,
								siteUrl: siteURL,
								code: '400',
								message: "That URL isn't urs >:("
							};
							log(`Returned ${view_name}`)
							fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
						}
					})
				} else {
					let view_name = 'error.html'
					let json = {
						siteName: siteName,
						siteUrl: siteURL,
						code: '400',
						message: "That URL doesn't exist"
					};
					log(`Returned ${view_name}`)
					fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
				}
			})
		} else {
			res.redirect('/');
		}
	} catch (err) {
		let view_name = 'error.html'
		let json = {
			siteName: siteName,
			siteUrl: siteURL,
			code: '401',
			message: "You aren't an allowed user, sorry!"
		};
		log.error("Error! Sent 401")
		fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
	}
});

app.get('/:id', async (req, res) => {
	try {
		await db.get('short_url_' + req.params.id).then(url => {
			if (url.startsWith("https://replit.com/") && regex.test(url)) {
				db.get('social_media_' + req.params.id).then(content => {
					if (content == null) {
						res.redirect(url);
					}
					let view_name = 'redirect.html'
					let repl_author = url.substring(19, url.indexOf('/', 19))
					let json = {
						repl_name: content.name,
						repl_author: repl_author,
						repl_desc: content.desc,
						repl_lang: content.lang,
						repl_img: content.img,
						repl_url: url
					}
					log(`Returned ${view_name}`)
					fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
				})
			} else {
				res.redirect(url);
			}
		})
	} catch (err) {
		let view_name = 'error.html'
		let json = {
			siteName: siteName,
			siteUrl: siteURL,
			code: '400',
			message: "That URL doesn't exist, sorry!"
		};
		log.error("Error! Sent 400")
		fs.readFile(`views/${view_name}`, 'utf8', async (err, data) => res.end(ejs.render(data, json)));
	}
});

app.listen(8008, '0.0.0.0', () => {
	console.log("We are live on 8008");
})

//getting images
//opengraph :) (caching should be used for this. need to redesign the url object, also keeping as one will probably be simplet)
//https://davidwalsh.name/open-graph-data-nodejs