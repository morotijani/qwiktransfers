const { User } = require('./models');

async function debugAll() {
    try {
        const users = await User.findAll({
            order: [['id', 'DESC']],
            limit: 10
        });

        console.log('--- Last 10 Users ---');
        users.forEach(u => {
            console.log(`Email: ${u.email}`);
            console.log(`Verified: ${u.is_email_verified}`);
            console.log(`Token: ${u.verification_token ? u.verification_token.substring(0, 8) + '...' : 'NULL'}`);
            console.log(`Expires: ${u.verification_token_expires}`);
            console.log('-----------------------------');
        });
        process.exit(0);
    } catch (error) {
        console.error('Debug failed:', error);
        process.exit(1);
    }
}

debugAll();
