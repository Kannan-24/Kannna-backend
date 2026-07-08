import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import pg from "pg";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const receiverEmail = process.env.RECEIVER_EMAIL || emailUser;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;
const corsOrigin = process.env.CORS_ORIGIN || "*";
const databaseUrl = process.env.DATABASE_URL;
const dbHost = process.env.DB_HOST;
const dbPort = Number(process.env.DB_PORT || 5432);
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbSsl = process.env.DB_SSL === "true";
const dbMaxRetries = Number(process.env.DB_MAX_RETRIES || 5);
const dbRetryDelayMs = Number(process.env.DB_RETRY_DELAY_MS || 2000);

if (!adminUsername || !adminPassword || !jwtSecret) {
    throw new Error("Missing ADMIN_USERNAME, ADMIN_PASSWORD, or JWT_SECRET in environment variables.");
}

if (!emailUser || !emailPass) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables.");
}

if (!databaseUrl && (!dbHost || !dbName || !dbUser || !dbPassword)) {
    throw new Error(
        "Missing database configuration. Set DATABASE_URL or DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD."
    );
}

const defaultContent = {
    hero: {
        greeting: "Hi, I'm",
        name: "Kannan M",
        description:
            "I'm a Trainee Software Engineer focusing on React development with API integrations, supported by experience in Laravel, AWS, Git, and DevOps tools. I apply my skills to real-world projects while continuously learning and improving.",
        ctaText: "Let's Connect",
        roles: ["Trainee Software Engineer", "Laravel Developer", "React Developer"],
    },
    skills: [
        { label: "Java", iconKey: "java" },
        { label: "JavaScript", iconKey: "javascript" },
        { label: "PHP", iconKey: "php" },
        { label: "Python", iconKey: "python" },
        { label: "HTML5", iconKey: "html5" },
        { label: "CSS3", iconKey: "css3" },
        { label: "Laravel", iconKey: "laravel" },
        { label: "React", iconKey: "react" },
        { label: "Bootstrap", iconKey: "bootstrap" },
        { label: "Tailwind CSS", iconKey: "tailwind css" },
        { label: "MySQL", iconKey: "mysql" },
        { label: "GitHub Actions", iconKey: "github actions" },
        { label: "Linux", iconKey: "linux" },
        { label: "Git", iconKey: "git" },
        { label: "VS Code", iconKey: "vs code" },
        { label: "Figma", iconKey: "figma" },
        { label: "Netlify", iconKey: "netlify" },
        { label: "Manual Testing", iconKey: "manual testing" },
    ],
    projects: [
        {
            title: "Automated Transport Management System",
            text: "Developed a web-based solution to streamline campus transportation. Integrated live tracking, attendance monitoring, and automated reporting to reduce errors and improve operational efficiency.",
            tags: ["Laravel", "Tailwind CSS", "MySQL"],
            githubLink: "https://github.com/Kannan-24/atms",
            externalLink: "",
        },
        {
            title: "Invoice Management System",
            text: "Built a comprehensive tool to create, manage, and track GST-compliant invoices. Automated payment reminders and financial reporting to enhance billing accuracy and efficiency.",
            tags: ["Laravel", "Tailwind CSS", "MySQL"],
            githubLink: "https://github.com/Kannan-24/ims",
            externalLink: "",
        },
        {
            title: "Spotify Clone (Music Streaming UI)",
            text: "Designed and implemented a responsive Spotify-inspired UI using React.js. Built dynamic pages for playlists and music categories with reusable components and modern design practices.",
            tags: ["React", "HTML", "CSS"],
            githubLink: "https://github.com/Kannan-24/music-player",
            externalLink: "https://kannanmp.netlify.app",
        },
    ],
    experiences: [
        {
            company: "NuWare Systems LLP",
            role: "Trainee Software Engineer",
            period: "October 2025 - Present",
            location: "Bangalore, India",
            summary:
                "Working on full-stack development tasks with a focus on frontend implementation and API integrations.",
        },
    ],
};

const SECTION_KEYS = ["hero", "skills", "projects", "experiences"];
const { Pool } = pg;
let db;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createDbPool = () => {
    if (databaseUrl) {
        return new Pool({
            connectionString: databaseUrl,
            ssl: dbSsl ? { rejectUnauthorized: false } : false,
        });
    }

    return new Pool({
        host: dbHost,
        port: dbPort,
        database: dbName,
        user: dbUser,
        password: dbPassword,
        ssl: dbSsl ? { rejectUnauthorized: false } : false,
    });
};

const testDbConnectionWithRetry = async () => {
    let lastError;

    for (let attempt = 1; attempt <= dbMaxRetries; attempt += 1) {
        try {
            db = createDbPool();
            await db.query("SELECT 1");
            return;
        } catch (error) {
            lastError = error;

            if (db) {
                await db.end().catch(() => {});
            }

            const shouldRetry = attempt < dbMaxRetries;
            console.error(
                `Database connection attempt ${attempt}/${dbMaxRetries} failed: ${error.code || error.message}`
            );

            if (!shouldRetry) {
                break;
            }

            await sleep(dbRetryDelayMs);
        }
    }

    throw lastError;
};

const initDb = async () => {
    await testDbConnectionWithRetry();

    await db.query(`
        CREATE TABLE IF NOT EXISTS contact_messages (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS portfolio_content (
            section TEXT PRIMARY KEY,
            data TEXT NOT NULL
        );
    `);

    for (const key of SECTION_KEYS) {
        await db.query(
            "INSERT INTO portfolio_content(section, data) VALUES($1, $2) ON CONFLICT(section) DO NOTHING",
            [key, JSON.stringify(defaultContent[key])]
        );
    }
};

const readAllContent = async () => {
    const { rows } = await db.query("SELECT section, data FROM portfolio_content");
    const output = { ...defaultContent };
    rows.forEach((row) => {
        try {
            output[row.section] = JSON.parse(row.data);
        } catch {
            output[row.section] = defaultContent[row.section];
        }
    });
    return output;
};

const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, jwtSecret);
        req.admin = payload;
        return next();
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

// Middleware
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: emailUser,
        pass: emailPass,
    },
});

app.get("/health", (_, res) => {
    res.json({ success: true, message: "Backend is running" });
});

app.get("/content", async (_, res) => {
    const content = await readAllContent();
    res.json({ success: true, content });
});

app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;

    if (username !== adminUsername || password !== adminPassword) {
        return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const token = jwt.sign({ role: "admin", username }, jwtSecret, {
        expiresIn: "8h",
    });

    return res.json({ success: true, token });
});

app.get("/admin/content", verifyAdminToken, async (_, res) => {
    const content = await readAllContent();
    res.json({ success: true, content });
});

app.put("/admin/content/:section", verifyAdminToken, async (req, res) => {
    const { section } = req.params;
    const { data } = req.body;

    if (!SECTION_KEYS.includes(section)) {
        return res.status(400).json({ success: false, message: "Invalid section" });
    }

    await db.query(
        "INSERT INTO portfolio_content(section, data) VALUES($1, $2) ON CONFLICT(section) DO UPDATE SET data = EXCLUDED.data",
        [section, JSON.stringify(data ?? defaultContent[section])]
    );

    return res.json({ success: true, message: `${section} updated` });
});

app.get("/admin/messages", verifyAdminToken, async (_, res) => {
    const { rows: messages } = await db.query(
        "SELECT id, name, email, message, created_at AS \"createdAt\" FROM contact_messages ORDER BY id DESC"
    );
    res.json({ success: true, messages });
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

    await db.query(
        "INSERT INTO contact_messages(name, email, message) VALUES($1, $2, $3)",
        [name, email, message]
    );

    // Email to admin
    const mailOptionsAdmin = {
        from: `"Kannan M" <${emailUser}>`,
        to: receiverEmail,
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
        from: `"Kannan M" <${emailUser}>`,
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
            message: "Message stored and email sent successfully!",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Message stored, but email sending failed. Please try again later.",
        });
    }
});

initDb()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.error("Failed to initialize database", error);
        console.error(
            "Check DB env values (host, port, db name, user, password), SSL setting, and DNS/network access from this machine."
        );
        process.exit(1);
    });
