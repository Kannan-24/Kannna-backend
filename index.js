import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "kannanmuruganandham1@gmail.com", // Your email
        pass: "hnbyqifukcpybwqi", // Your generated app password
    },
});

// Handle POST request for sending email
app.post("/send-email", async (req, res) => {
    const { name, email, message } = req.body;

    // Email validation
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: "Name, email, and message are required.",
        });
    }

    // Email to admin
    const mailOptionsAdmin = {
        from: `"Kannan M" <kannanmuruganandham1@gmail.com>`,
        to: "kannanmuruganandham1@gmail.com",
        subject: `New message from ${name}`,
        html: `
                        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                                <h2 style="color: #2c3e50; margin: 0;">New Message from ${name}</h2>
                                <hr style="border: 1px solid #ecf0f1; margin: 20px 0;" />
                                <p><strong>Name:</strong> ${name}</p>
                                <p><strong>Email:</strong> ${email}</p>
                                <p><strong>Message:</strong></p>
                                <p style="background-color: #ecf0f1; padding: 10px; border-radius: 5px;">${message}</p>
                                <hr />
                                <p style="font-size: 12px; color: #7f8c8d;">This message was sent via your portfolio website's contact form.</p>
                        </div>
                `,
    };

    // Email to user (confirmation)
    const mailOptionsUser = {
        from: `"Kannan M" <kannanmuruganandham1@gmail.com>`,
        to: email,
        subject: "Thank you for contacting me!",
        html: `
                        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
                                <h2 style="margin: 10px 0 0; color: #2c3e50;">Kannan M</h2>
                                <p style="color: #7f8c8d; font-size: 14px;">Full-Stack Developer | Portfolio Website</p>
                                <hr style="border: 1px solid #ecf0f1;" />
                                <p style="font-size: 16px; margin-top: 20px;">Hello ${name},</p>
                                <p style="font-size: 16px;">Thank you for reaching out to me through my portfolio website. I have received your message and will get back to you as soon as possible.</p>
                                <p style="font-size: 16px; font-weight: bold;">Your message:</p>
                                <p style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; font-style: italic;">${message}</p>
                                <p style="font-size: 16px;">I appreciate your interest in my work!</p>
                                <p style="font-size: 16px;">Best regards,<br>Kannan M</p>
                                <hr />
                                <p style="text-align: center; font-size: 12px; color: #7f8c8d;">This is an automated confirmation message.</p>
                        </div>
                `,
    };

    try {
        // Send email to admin
        await transporter.sendMail(mailOptionsAdmin);

        // Send confirmation email to user
        await transporter.sendMail(mailOptionsUser);

        res.json({
            success: true,
            message: "Message sent successfully and confirmation email sent!",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send email. Please try again.",
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
