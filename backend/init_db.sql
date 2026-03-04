-- ============================================================
-- Script d'initialisation — Task Similarity Analyzer v2.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS task_similarity
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE task_similarity;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    is_active       BOOLEAN      DEFAULT TRUE,
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email    (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des tâches
CREATE TABLE IF NOT EXISTS tasks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT         NOT NULL,
    owner_id    INT          NOT NULL,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FULLTEXT INDEX ft_title_desc (title, description),
    INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des logs d'analyse
CREATE TABLE IF NOT EXISTS analysis_logs (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL,
    analysis_type    VARCHAR(20)  NOT NULL DEFAULT 'single',
    source_filename  VARCHAR(255) NULL,
    total_submitted  INT          DEFAULT 1,
    total_analyzed   INT          DEFAULT 0,
    duplicates_found INT          DEFAULT 0,
    strong_matches   INT          DEFAULT 0,
    moderate_matches INT          DEFAULT 0,
    clean_tasks      INT          DEFAULT 0,
    column_mapping   JSON         NULL,
    status           VARCHAR(20)  DEFAULT 'success',
    error_message    TEXT         NULL,
    created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, created_at),
    INDEX idx_type      (analysis_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
