const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Use environment variables for security
    pass: process.env.PASSWORD,
  },
});

// Handle the incoming POST request from the contact form
app.post("/send-email", (req, res) => {
  const { name, email, message } = req.body;

  const mailOptionsAdmin = {
    from: email,
    to: process.env.EMAIL,
    subject: `New message from ${name}`,
    html: `<p>${message}</p>`,
  };

  transporter.sendMail(mailOptionsAdmin, (error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to send email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Message sent successfully!",
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
