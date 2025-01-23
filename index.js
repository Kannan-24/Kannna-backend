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

    // Email to admin
    const mailOptionsAdmin = {
        from: email, // From the user's email
        to: "kannanmuruganandham1@gmail.com", // Admin's email
        subject: `New message from ${name}`, // Subject of the email
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #2c3e50;">New Message from ${name}</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p style="background-color: #ecf0f1; padding: 10px; border-radius: 5px;">${message}</p>
                <hr />
                <p style="font-size: 12px; color: #7f8c8d;">This message was sent via your website's contact form.</p>
            </div>
        `,
    };

    // Email to user (confirmation)
    const mailOptionsUser = {
        from: "kannanmuruganandham1@gmail.com", // Your email
        to: email, // User's email
        subject: "Thank you for your message!", // Confirmation subject
        html: `
            <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
                <div style="background-color: #2c3e50; color: white; padding: 10px; border-radius: 5px;">
                    <h2 style="margin: 0;">Thank you for your message, ${name}!</h2>
                </div>
                <p style="font-size: 16px; margin-top: 20px;">Hello ${name},</p>
                <p style="font-size: 16px;">Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
                <p style="font-size: 16px; font-weight: bold;">Your message:</p>
                <p style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; font-style: italic;">${message}</p>
                <p style="font-size: 16px;">We appreciate your interest in our services!</p>
                <p style="font-size: 16px;">Best regards,<br>Kannan M</p>
                <hr />
                <p style="font-size: 12px; color: #7f8c8d;">This is an automated confirmation message.</p>
            </div>
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
                message: "Message sent successfully and confirmation email sent!",
            });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
