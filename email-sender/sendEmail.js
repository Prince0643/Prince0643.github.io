const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'tolentinochristian89@gmail.com',
        pass: 'pmhu ieju vixh ozmy' // Consider using environment variables for sensitive data
    }
});

// Function to send email
const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: '"NLUCycle" <tolentinochristian89@gmail.com>',
        to: to,
        subject: subject,
        text: text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error occurred: ' + error.message);
        } else {
            console.log('Message sent: ' + info.messageId);
        }
    });
};

// Endpoint to send email
app.post('/send-email', (req, res) => {
    const { to, subject, text } = req.body;
    sendEmail(to, subject, text);
    res.status(200).send('Email sending initiated.');
});

// Schedule email sending every hour
cron.schedule('0 * * * *', () => {
    console.log('Running scheduled email task...');
    // Example: Send an email to a specific recipient
    sendEmail('recipient@example.com', 'Scheduled Email', 'This is a scheduled email sent every hour.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});