
const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, Date.now() + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);

        if (ext && mime) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG and WEBP images are allowed."));
        }
    }
});

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "personal_portfolio"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }
    console.log("MySQL connected successfully!");
});

function runQuery(sql, values = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

function handleError(res, err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
}

// Get portfolio information
app.get("/api/portfolio", async (req, res) => {
    try {
        const [profile, skills, education, experience, projects] =
            await Promise.all([
                runQuery("SELECT * FROM profile ORDER BY id DESC LIMIT 1"),
                runQuery("SELECT * FROM skills ORDER BY id DESC"),
                runQuery("SELECT * FROM education ORDER BY id DESC"),
                runQuery("SELECT * FROM experience ORDER BY id DESC"),
                runQuery("SELECT * FROM projects ORDER BY id DESC")
            ]);

        res.json({
            profile: profile[0] || null,
            skills,
            education,
            experience,
            projects
        });
    } catch (err) {
        handleError(res, err);
    }
});

// Add or update profile
app.post("/api/profile", upload.single("profile_image"), async (req, res) => {
    try {
        const { full_name, title, email, phone, location, about } = req.body;

        if (!full_name || !full_name.trim()) {
            return res.status(400).json({ message: "Full name is required." });
        }

        const existing = await runQuery(
            "SELECT * FROM profile ORDER BY id DESC LIMIT 1"
        );

        const image = req.file
            ? "/uploads/" + req.file.filename
            : existing[0]?.profile_image || null;

        const values = [
            full_name.trim(),
            title || "",
            email || "",
            phone || "",
            location || "",
            about || "",
            image
        ];

        if (existing.length) {
            await runQuery(
                `UPDATE profile SET full_name=?, title=?, email=?, phone=?,
                 location=?, about=?, profile_image=? WHERE id=?`,
                [...values, existing[0].id]
            );
        } else {
            await runQuery(
                `INSERT INTO profile
                 (full_name, title, email, phone, location, about, profile_image)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                values
            );
        }

        res.json({ message: "Profile saved successfully!" });
    } catch (err) {
        handleError(res, err);
    }
});

// Add, edit and delete skills, education, experience and projects
const sections = {
    skills: {
        fields: ["skill_name", "proficiency"],
        required: ["skill_name"]
    },
    education: {
        fields: ["institution", "degree", "start_year", "end_year", "description"],
        required: ["institution"]
    },
    experience: {
        fields: ["company", "job_title", "start_date", "end_date", "description"],
        required: ["company"]
    },
    projects: {
        fields: ["project_name", "description", "technologies", "project_link"],
        required: ["project_name"]
    }
};

for (const [table, config] of Object.entries(sections)) {
    app.post(`/api/${table}`, async (req, res) => {
        try {
            for (const field of config.required) {
                if (!req.body[field] || !String(req.body[field]).trim()) {
                    return res.status(400).json({
                        message: `${field} is required.`
                    });
                }
            }

            const values = config.fields.map((field) => {
                if (field === "proficiency") {
                    const n = Number(req.body[field] ?? 80);
                    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 80;
                }
                return req.body[field] ?? "";
            });

            const id = Number(req.body.id);

            if (id > 0) {
                const assignments = config.fields.map((f) => `${f}=?`).join(", ");
                const result = await runQuery(
                    `UPDATE ${table} SET ${assignments} WHERE id=?`,
                    [...values, id]
                );

                if (!result.affectedRows) {
                    return res.status(404).json({ message: "Record not found." });
                }

                return res.json({ message: "Record updated successfully!" });
            }

            await runQuery(
                `INSERT INTO ${table} (${config.fields.join(", ")})
                 VALUES (${config.fields.map(() => "?").join(", ")})`,
                values
            );

            res.status(201).json({ message: "Record added successfully!" });
        } catch (err) {
            handleError(res, err);
        }
    });

    app.delete(`/api/${table}/:id`, async (req, res) => {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({ message: "Invalid record ID." });
            }

            const result = await runQuery(
                `DELETE FROM ${table} WHERE id=?`,
                [id]
            );

            if (!result.affectedRows) {
                return res.status(404).json({ message: "Record not found." });
            }

            res.json({ message: "Record deleted successfully!" });
        } catch (err) {
            handleError(res, err);
        }
    });
}

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    }
    if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});

app.listen(PORT, () => {
    console.log(`Portfolio website running at http://localhost:${PORT}`);
});
