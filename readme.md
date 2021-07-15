# Replit.sh v4

This is the URL shortener for replit. Simply import it into Replit, make a secret called `IDS` and put a JSON array of your allowed JSON IDs inside. For example, if I wanted user IDs 12, 123, and 1234, I my secret would look like `[12,123,1234]`. If you need to find someone's user id, just have them go to https://replit-auth.ritza.repl.co/ and relay back their user ID.

## Importing or Exporting Data

Simply running `import.js` or `export.js` in the `data` folder will do the job. Running `import.js` takes the data from `in.json` and inserts it into the database and running `export.js` takes the data from the database and exports it to `out.json`.

btw this will only run on replit (unless you want to modify it ig lol)