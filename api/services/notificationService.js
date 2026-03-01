const { Notification, User } = require('../models');
const { sendPushMessage } = require('./pushNotification');

/**
 * Send an in-app notification to a user.
 * @param {Object} data - The notification data
 * @param {Number} data.userId - ID of the user to notify
 * @param {String} data.type - Type of notification (e.g., 'TRANSACTION_UPDATE', 'SYSTEM_ALERT')
 * @param {String} data.message - The notification message
 */
const createNotification = async ({ userId, type, message }) => {
    try {
        await Notification.create({
            userId,
            type,
            message
        });

        // Trigger an Expo Push Notification if the user has a registered token
        try {
            const user = await User.findByPk(userId);
            if (user && user.expo_push_token) {
                let title = 'QwikTransfers Update';
                if (type === 'TRANSACTION_UPDATE') title = 'Transaction Update';
                else if (type === 'RATE_ALERT') title = 'Rate Alert';

                await sendPushMessage(user.expo_push_token, title, message, { type });
            }
        } catch (pushErr) {
            console.error('Failed to send push notification:', pushErr);
        }

    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

module.exports = { createNotification };
