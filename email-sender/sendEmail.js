//const nodemailer = require('nodemailer');
//
//// Create a transporter object using SMTP
//const transporter = nodemailer.createTransport({
//    host: 'smtp.gmail.com', // Replace with your SMTP server
//    port: 587, // Replace with your SMTP port
//    secure: false, // true for 465, false for other ports
//    auth: {
//        user: 'tolentinochristian89@gmail.com', // Replace with your email
//        pass: 'pmhu ieju vixh ozmy' // Replace with your email password
//    }
//});
//
//// Function to send email
//function sendEmail(to, subject, text) {
//    const mailOptions = {
//        from: '"Your Name" <tolentinochristian89@gmail.com>', // sender address
//        to: to, // list of receivers
//        subject: subject, // Subject line
//        text: text, // plain text body
//        // html: '<b>Hello world?</b>' // html body (optional)
//    };
//
//    transporter.sendMail(mailOptions, (error, info) => {
//        if (error) {
//            return console.log('Error occurred: ' + error.message);
//        }
//        console.log('Message sent: %s', info.messageId);
//    });
//}
//
//// Example usage
//sendEmail('ladyshorty05@gmail.com', 'Test Subject', 'This is a test email sent from Node.js!');

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'tolentinochristian89@gmail.com',
        pass: 'pmhu ieju vixh ozmy'
    }
});

app.post('/send-email', (req, res) => {
    const { to, subject, text } = req.body;

    const mailOptions = {
        from: '"NLUCycle" <tolentinochristian89@gmail.com>',
        to: to,
        subject: subject,
        text: text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error occurred: ' + error.message);
        }
        res.status(200).send('Message sent: ' + info.messageId);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

