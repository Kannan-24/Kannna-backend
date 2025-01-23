import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";

// Create an express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors()); // Allow CORS
app.use(express.json()); // Parse JSON requests

// Configure the email transporter using nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail", // Gmail service
    auth: {
        user: "kannanmuruganandham1@gmail.com", // Your email
        pass: "hnbyqifukcpybwqi", // Your generated app password
    },
});

// Handle POST request from the contact form to send the email
app.post("/send-email", (req, res) => {
    const { name, email, message } = req.body;

    const mailOptionsAdmin = {
        from: email, // From the user's email
        to: "kannanmuruganandham1@gmail.com", // Admin's email
        subject: `New message from ${name}`,
        html: `
            <h2>New Message from ${name}</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `,
    };

    const mailOptionsUser = {
        from: "kannanmuruganandham1@gmail.com", // Your email
        to: email, // User's email
        subject: "Thank you for your message!",
        html: `
            <h2>Thank you for your message, ${name}!</h2>
            <p>We have received your message and will get back to you soon.</p>
            <p>Your message: ${message}</p>
        `,
    };

    // Send email to admin
    transporter.sendMail(mailOptionsAdmin, (error) => {
        if (error) {
            return res.json({
                success: false,
                message: "Failed to send email to admin. Please try again.",
            });
        }

        // Send confirmation email to user
        transporter.sendMail(mailOptionsUser, (error) => {
            if (error) {
                return res.json({
                    success: false,
                    message: "Failed to send confirmation email. Please try again.",
                });
            }

            res.json({
                success: true,
                message: "Message sent successfully!",
            });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
