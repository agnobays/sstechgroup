import bcrypt from 'bcryptjs';
import readline from 'readline';
import { db, initDatabase } from '../db/database.js';
initDatabase();
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
    }));
}
async function run() {
    console.log('\n=========================================');
    console.log(' S&S Tech Group — Admin Account Creator');
    console.log('=========================================\n');
    // Check command line arguments first: --email, --password, --name
    const args = process.argv.slice(2);
    let email = '';
    let password = '';
    let fullName = '';
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--email' && args[i + 1])
            email = args[++i];
        if (args[i] === '--password' && args[i + 1])
            password = args[++i];
        if (args[i] === '--name' && args[i + 1])
            fullName = args[++i];
    }
    if (!email)
        email = await askQuestion('Enter Admin Email: ');
    if (!fullName)
        fullName = await askQuestion('Enter Admin Full Name: ');
    if (!password)
        password = await askQuestion('Enter Admin Password (min 8 chars): ');
    if (!email || !email.includes('@')) {
        console.error('❌ Error: A valid email address is required.');
        process.exit(1);
    }
    if (!fullName) {
        console.error('❌ Error: Full name is required.');
        process.exit(1);
    }
    if (!password || password.length < 8) {
        console.error('❌ Error: Password must be at least 8 characters long.');
        process.exit(1);
    }
    const saltRounds = 12;
    const hash = bcrypt.hashSync(password, saltRounds);
    const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(email.toLowerCase());
    if (existing) {
        db.prepare(`
      UPDATE admins
      SET password_hash = ?, full_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hash, fullName, existing.id);
        console.log(`\n✅ Password and details updated for existing admin: ${email.toLowerCase()}`);
    }
    else {
        db.prepare(`
      INSERT INTO admins (email, password_hash, full_name, role)
      VALUES (?, ?, ?, 'super_admin')
    `).run(email.toLowerCase(), hash, fullName);
        console.log(`\n✅ New admin account provisioned successfully: ${email.toLowerCase()}`);
    }
    console.log('\nYou can now log in at /admin/login');
    process.exit(0);
}
run().catch((err) => {
    console.error('Fatal error provisioning admin:', err);
    process.exit(1);
});
