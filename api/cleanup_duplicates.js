const { User } = require('./models');

async function cleanup() {
    try {
        const users = await User.findAll({
            order: [['id', 'ASC']]
        });

        const seenEmails = new Set();
        const duplicates = [];

        for (const user of users) {
            if (seenEmails.has(user.email)) {
                duplicates.push(user.id);
            } else {
                seenEmails.add(user.email);
            }
        }

        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} duplicate users. Deleting...`);
            await User.destroy({
                where: {
                    id: duplicates
                }
            });
            console.log('Cleanup successful.');
        } else {
            console.log('No duplicates found.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanup();
