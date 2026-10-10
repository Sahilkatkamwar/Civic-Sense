const db = require('./db/db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Database tables successfully created:');
console.log(tables);

const categories = db.prepare('SELECT * FROM categories').all();
console.log(`Seeded ${categories.length} categories.`);

const authorities = db.prepare('SELECT * FROM authorities').all();
console.log(`Seeded ${authorities.length} authorities.`);

const complaints = db.prepare('SELECT * FROM complaints').all();
console.log(`Seeded ${complaints.length} demo complaints.`);
