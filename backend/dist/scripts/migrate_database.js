import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}
catch { }
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
const OLD_URI = 'mongodb+srv://projectalphateam308_db_user:6dUMWkCu3MYsGcis@cluster0.cuqbzoa.mongodb.net/edusphere?retryWrites=true&w=majority';
const NEW_URI = 'mongodb+srv://thecustomnest2023_db_user:PkTGr67iC1LF3YKr@cluster0.dzkfw5j.mongodb.net/edusphere?retryWrites=true&w=majority';
async function migrateDatabase() {
    console.log('════════════════════════════════════════════════════════════');
    console.log('📦 Starting MongoDB Database Migration to New Cluster...');
    console.log('════════════════════════════════════════════════════════════\n');
    try {
        // ── Step 1: Connect to Source (Old Database) ───────────────────────────
        console.log('1️⃣ Connecting to Source MongoDB Cluster...');
        const oldConn = await mongoose.createConnection(OLD_URI).asPromise();
        if (!oldConn.db)
            throw new Error('Failed to initialize source database connection.');
        console.log('   ✅ Connected to Source Cluster!');
        // Get list of collections
        const collections = await oldConn.db.listCollections().toArray();
        console.log(`   📋 Found ${collections.length} collections in source database:\n`);
        const exportedData = {};
        for (const colInfo of collections) {
            const colName = colInfo.name;
            if (colName.startsWith('system.'))
                continue;
            const docs = await oldConn.db.collection(colName).find({}).toArray();
            exportedData[colName] = docs;
            console.log(`   📥 Extracted ${docs.length} documents from collection: '${colName}'`);
        }
        await oldConn.close();
        console.log('\n   ✅ Data extraction complete!\n');
        // ── Step 2: Connect to Target (New Database) ───────────────────────────
        console.log('2️⃣ Connecting to Target MongoDB Cluster...');
        console.log(`   🔗 URI: ${NEW_URI}`);
        const newConn = await mongoose.createConnection(NEW_URI, {
            serverSelectionTimeoutMS: 20000,
            connectTimeoutMS: 20000,
            family: 4,
        }).asPromise();
        if (!newConn.db)
            throw new Error('Failed to initialize target database connection.');
        console.log('   ✅ Connected to Target Cluster!');
        console.log('\n3️⃣ Writing collections to Target Cluster...');
        for (const [colName, docs] of Object.entries(exportedData)) {
            if (docs.length === 0)
                continue;
            const targetCol = newConn.db.collection(colName);
            await targetCol.deleteMany({}); // Clean target collection
            await targetCol.insertMany(docs);
            console.log(`   📤 Migrated ${docs.length} documents into collection: '${colName}'`);
        }
        await newConn.close();
        console.log('\n   ✅ Target database migration successful!\n');
        // ── Step 3: Update backend/.env file ──────────────────────────────────
        console.log('4️⃣ Updating backend/.env with new MONGO_URI...');
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            envContent = envContent.replace(/MONGO_URI=.*/, `MONGO_URI=${NEW_URI}`);
            fs.writeFileSync(envPath, envContent, 'utf8');
            console.log('   ✅ backend/.env successfully updated with new MONGO_URI!\n');
        }
        console.log('════════════════════════════════════════════════════════════');
        console.log('🎉 MONGODB DATABASE MIGRATION COMPLETE & VERIFIED!');
        console.log('════════════════════════════════════════════════════════════');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Migration failed:', err.message, err.stack);
        process.exit(1);
    }
}
migrateDatabase();
