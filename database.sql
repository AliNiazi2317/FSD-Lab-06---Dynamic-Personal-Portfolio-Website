
USE personal_portfolio;

CREATE TABLE IF NOT EXISTS profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    title VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(30),
    location VARCHAR(150),
    about TEXT,
    profile_image VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL,
    proficiency INT DEFAULT 80
);

CREATE TABLE IF NOT EXISTS education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution VARCHAR(150) NOT NULL,
    degree VARCHAR(150),
    start_year VARCHAR(20),
    end_year VARCHAR(20),
    description TEXT
);

CREATE TABLE IF NOT EXISTS experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(150) NOT NULL,
    job_title VARCHAR(150),
    start_date VARCHAR(30),
    end_date VARCHAR(30),
    description TEXT
);

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(150) NOT NULL,
    description TEXT,
    technologies VARCHAR(255),
    project_link VARCHAR(255)
);
