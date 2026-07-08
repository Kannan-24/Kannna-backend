import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Environment Variables
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const receiverEmail = process.env.RECEIVER_EMAIL || emailUser;

if (!emailUser || !emailPass) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables.");
}

// Middleware
app.use(cors({
    origin: "*",
}));

app.use(express.json());

// Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Backend is running successfully 🚀",
        emailUser,
        receiverEmail,
    });
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: emailUser,
        pass: emailPass,
    },
});

// Verify SMTP Connection
transporter.verify((error, success) => {
    if (error) {
        console.error("==================================");
        console.error("SMTP VERIFY FAILED");
        console.error(error);
        console.error("==================================");
    } else {
        console.log("==================================");
        console.log("SMTP SERVER IS READY");
        console.log("==================================");
    }
});

// Send Email API
app.post("/send-email", async (req, res) => {

    console.log("Incoming Request:");
    console.log(req.body);

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: "Name, email and message are required.",
        });
    }

    const mailOptionsAdmin = {
        from: `"Portfolio Contact" <${emailUser}>`,
        to: receiverEmail,
        subject: `New message from ${name}`,
        html: `
            <h2>New Portfolio Contact</h2>

            <p><b>Name:</b> ${name}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Message:</b></p>

            <p>${message}</p>
        `,
    };

    const mailOptionsUser = {
        from: `"Kannan M" <${emailUser}>`,
        to: email,
        subject: "Thank you for contacting me!",
        html: `
            <h2>Hello ${name},</h2>

            <p>
                Thank you for contacting me through my portfolio website.
            </p>

            <p>
                I have received your message and will get back to you soon.
            </p>

            <hr>

            <p><b>Your Message:</b></p>

            <p>${message}</p>

            <br>

            <p>
                Regards,
                <br>
                Kannan M
            </p>
        `,
    };

    try {

        console.log("Sending admin email...");

        const adminInfo = await transporter.sendMail(mailOptionsAdmin);

        console.log("Admin email sent.");
        console.log(adminInfo);

        console.log("Sending confirmation email...");

        const userInfo = await transporter.sendMail(mailOptionsUser);

        console.log("Confirmation email sent.");
        console.log(userInfo);

        return res.status(200).json({
            success: true,
            message: "Emails sent successfully.",
        });

    } catch (error) {

        console.error("==================================");
        console.error("EMAIL SEND FAILED");
        console.error(error);
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("==================================");

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }

});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Start Server
app.listen(port, () => {
    console.log("==================================");
    console.log(`Server running on port ${port}`);
    console.log(`Email User : ${emailUser}`);
    console.log(`Receiver   : ${receiverEmail}`);
    console.log("==================================");
});
