SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
DROP DATABASE IF EXISTS tripgenie;
CREATE DATABASE tripgenie CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tripgenie;

CREATE TABLE users (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 email VARCHAR(190) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 phone VARCHAR(30) NULL,
 profile_image VARCHAR(1000) NULL,
 role ENUM('user','admin') NOT NULL DEFAULT 'user',
 status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
 last_login_at DATETIME NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX idx_users_role_status(role,status)
) ENGINE=InnoDB;

CREATE TABLE user_preferences (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL UNIQUE,
 interests TEXT NULL,
 preferred_cuisines TEXT NULL,
 dietary_requirements TEXT NULL,
 hotel_preference VARCHAR(50) DEFAULT 'budget',
 transport_preference VARCHAR(50) DEFAULT 'mixed',
 travel_style VARCHAR(50) DEFAULT 'balanced',
 preferred_activities TEXT NULL,
 default_currency CHAR(3) DEFAULT 'INR',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_preferences_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE destinations (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(150) NOT NULL UNIQUE,
 city VARCHAR(120) NOT NULL,
 state VARCHAR(120) NOT NULL,
 country VARCHAR(120) NOT NULL DEFAULT 'India',
 description TEXT NOT NULL,
 category VARCHAR(80) NOT NULL,
 climate VARCHAR(80) NULL,
 best_season VARCHAR(120) NULL,
 minimum_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
 average_daily_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
 image VARCHAR(1000) NULL,
 latitude DECIMAL(10,7) NULL,
 longitude DECIMAL(10,7) NULL,
 rating DECIMAL(3,2) DEFAULT 4.00,
 status ENUM('active','inactive') DEFAULT 'active',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX idx_dest_search(status,category,minimum_budget), INDEX idx_dest_city(city)
) ENGINE=InnoDB;

CREATE TABLE destination_images (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 destination_id INT UNSIGNED NOT NULL,
 image_url VARCHAR(1000) NOT NULL,
 alt_text VARCHAR(255) NULL,
 sort_order INT DEFAULT 0,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_dest_img FOREIGN KEY(destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
 INDEX idx_dest_images(destination_id,sort_order)
) ENGINE=InnoDB;

CREATE TABLE hotels (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 destination_id INT UNSIGNED NOT NULL,
 name VARCHAR(180) NOT NULL,
 description TEXT NULL,
 location VARCHAR(255) NOT NULL,
 price_per_night DECIMAL(12,2) NOT NULL,
 rating DECIMAL(3,2) DEFAULT 0,
 hotel_type ENUM('budget','mid-range','premium','hostel','homestay') NOT NULL,
 room_type VARCHAR(100) NOT NULL,
 maximum_guests TINYINT UNSIGNED DEFAULT 2,
 amenities TEXT NULL,
 image VARCHAR(1000) NULL,
 contact VARCHAR(100) NULL,
 availability_status ENUM('available','limited','unavailable') DEFAULT 'available',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_hotel_dest FOREIGN KEY(destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
 UNIQUE KEY uq_hotel_dest_name(destination_id,name),
 INDEX idx_hotel_filter(destination_id,availability_status,price_per_night,rating)
) ENGINE=InnoDB;

CREATE TABLE restaurants (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 destination_id INT UNSIGNED NOT NULL,
 name VARCHAR(180) NOT NULL,
 description TEXT NULL,
 location VARCHAR(255) NOT NULL,
 cuisine VARCHAR(180) NOT NULL,
 average_cost_per_person DECIMAL(10,2) NOT NULL,
 rating DECIMAL(3,2) DEFAULT 0,
 dietary_options VARCHAR(255) NULL,
 opening_time TIME NULL,
 closing_time TIME NULL,
 image VARCHAR(1000) NULL,
 status ENUM('active','inactive') DEFAULT 'active',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_rest_dest FOREIGN KEY(destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
 UNIQUE KEY uq_rest_dest_name(destination_id,name),
 INDEX idx_rest_filter(destination_id,status,average_cost_per_person,rating)
) ENGINE=InnoDB;

CREATE TABLE attractions (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 destination_id INT UNSIGNED NOT NULL,
 name VARCHAR(180) NOT NULL,
 description TEXT NULL,
 location VARCHAR(255) NOT NULL,
 category VARCHAR(80) NOT NULL,
 entry_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
 recommended_duration INT UNSIGNED DEFAULT 90 COMMENT 'minutes',
 opening_time TIME NULL,
 closing_time TIME NULL,
 best_visit_time VARCHAR(80) NULL,
 rating DECIMAL(3,2) DEFAULT 0,
 image VARCHAR(1000) NULL,
 latitude DECIMAL(10,7) NULL,
 longitude DECIMAL(10,7) NULL,
 status ENUM('active','inactive') DEFAULT 'active',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_attr_dest FOREIGN KEY(destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
 UNIQUE KEY uq_attr_dest_name(destination_id,name),
 INDEX idx_attr_filter(destination_id,status,category,entry_fee,rating)
) ENGINE=InnoDB;

CREATE TABLE transportation (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 origin VARCHAR(180) NOT NULL DEFAULT 'Any',
 destination_id INT UNSIGNED NOT NULL,
 transport_type ENUM('flight','train','bus','cab','metro','ferry','local') NOT NULL,
 provider VARCHAR(180) NOT NULL,
 estimated_cost DECIMAL(12,2) NOT NULL,
 estimated_duration INT UNSIGNED NOT NULL COMMENT 'minutes',
 description TEXT NULL,
 status ENUM('active','inactive') DEFAULT 'active',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_transport_dest FOREIGN KEY(destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
 INDEX idx_transport_filter(destination_id,origin,status,estimated_cost)
) ENGINE=InnoDB;

CREATE TABLE travel_packages (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 destination_id INT UNSIGNED NOT NULL,
 name VARCHAR(180) NOT NULL,
 description TEXT NULL,
 days TINYINT UNSIGNED NOT NULL,
 base_price DECIMAL(12,2) NOT NULL,
 inclusions TEXT NULL,
 status ENUM('active','inactive') DEFAULT 'active',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_package_dest FOREIGN KEY(destination_id) REFERENCES destinations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE trips (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 title VARCHAR(180) NOT NULL,
 origin VARCHAR(180) NOT NULL,
 destination_id INT UNSIGNED NOT NULL,
 selected_hotel_id INT UNSIGNED NULL,
 start_date DATE NOT NULL,
 end_date DATE NOT NULL,
 traveller_count TINYINT UNSIGNED NOT NULL,
 total_budget DECIMAL(12,2) NOT NULL,
 estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
 remaining_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
 currency CHAR(3) DEFAULT 'INR',
 status ENUM('draft','planned','completed','cancelled') DEFAULT 'draft',
 ai_summary TEXT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_trip_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_trip_dest FOREIGN KEY(destination_id) REFERENCES destinations(id),
 CONSTRAINT fk_trip_hotel FOREIGN KEY(selected_hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
 INDEX idx_trip_user_status(user_id,status,created_at)
) ENGINE=InnoDB;

CREATE TABLE trip_days (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 trip_id INT UNSIGNED NOT NULL,
 day_number TINYINT UNSIGNED NOT NULL,
 trip_date DATE NOT NULL,
 title VARCHAR(180) NOT NULL,
 daily_total DECIMAL(12,2) DEFAULT 0,
 notes TEXT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_day_trip FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE,
 UNIQUE KEY uq_trip_day(trip_id,day_number)
) ENGINE=InnoDB;

CREATE TABLE itinerary_items (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 trip_day_id INT UNSIGNED NOT NULL,
 item_type ENUM('hotel','restaurant','attraction','transportation','activity','note') NOT NULL,
 related_record_id INT UNSIGNED NULL,
 title VARCHAR(180) NOT NULL,
 location VARCHAR(255) NULL,
 start_time TIME NULL,
 end_time TIME NULL,
 travel_minutes INT UNSIGNED DEFAULT 0,
 estimated_cost DECIMAL(12,2) DEFAULT 0,
 notes TEXT NULL,
 sort_order INT DEFAULT 0,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_item_day FOREIGN KEY(trip_day_id) REFERENCES trip_days(id) ON DELETE CASCADE,
 INDEX idx_items_day_time(trip_day_id,start_time)
) ENGINE=InnoDB;

CREATE TABLE trip_budgets (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 trip_id INT UNSIGNED NOT NULL UNIQUE,
 accommodation_cost DECIMAL(12,2) DEFAULT 0,
 food_cost DECIMAL(12,2) DEFAULT 0,
 attraction_cost DECIMAL(12,2) DEFAULT 0,
 transport_cost DECIMAL(12,2) DEFAULT 0,
 activity_cost DECIMAL(12,2) DEFAULT 0,
 miscellaneous_cost DECIMAL(12,2) DEFAULT 0,
 contingency_cost DECIMAL(12,2) DEFAULT 0,
 total_cost DECIMAL(12,2) DEFAULT 0,
 planned_budget DECIMAL(12,2) DEFAULT 0,
 remaining_amount DECIMAL(12,2) DEFAULT 0,
 per_person_cost DECIMAL(12,2) DEFAULT 0,
 per_day_cost DECIMAL(12,2) DEFAULT 0,
 percentage_used DECIMAL(7,2) DEFAULT 0,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_budget_trip FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE bookings (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 trip_id INT UNSIGNED NULL,
 booking_type ENUM('hotel','restaurant','transportation','attraction','package','other') NOT NULL,
 related_record_id INT UNSIGNED NULL,
 provider_reference VARCHAR(190) NULL,
 booking_date DATETIME NOT NULL,
 amount DECIMAL(12,2) DEFAULT 0,
 currency CHAR(3) DEFAULT 'INR',
 status ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
 notes TEXT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_booking_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_booking_trip FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE SET NULL,
 INDEX idx_booking_user(user_id,status,booking_date)
) ENGINE=InnoDB;

CREATE TABLE reviews (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 item_type ENUM('destination','hotel','restaurant','attraction','trip') NOT NULL,
 item_id INT UNSIGNED NOT NULL,
 rating TINYINT UNSIGNED NOT NULL,
 title VARCHAR(180) NULL,
 comment TEXT NOT NULL,
 status ENUM('pending','approved','rejected') DEFAULT 'pending',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_review_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 UNIQUE KEY uq_user_review(user_id,item_type,item_id),
 INDEX idx_review_item(item_type,item_id,status)
) ENGINE=InnoDB;

CREATE TABLE favourites (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 item_type ENUM('destination','hotel','restaurant','attraction') NOT NULL,
 item_id INT UNSIGNED NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_fav_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 UNIQUE KEY uq_favourite(user_id,item_type,item_id)
) ENGINE=InnoDB;

CREATE TABLE ai_conversations (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 title VARCHAR(180) NOT NULL,
 status ENUM('active','archived') DEFAULT 'active',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_conv_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE ai_messages (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 conversation_id INT UNSIGNED NOT NULL,
 role ENUM('user','assistant','system') NOT NULL,
 content TEXT NOT NULL,
 token_count INT UNSIGNED NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_msg_conv FOREIGN KEY(conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
 INDEX idx_msg_conv(conversation_id,created_at)
) ENGINE=InnoDB;

CREATE TABLE ai_request_logs (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NULL,
 endpoint VARCHAR(100) NOT NULL,
 source ENUM('groq','fallback') NOT NULL,
 status ENUM('success','error') NOT NULL DEFAULT 'success',
 duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
 error_message VARCHAR(500) NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_ai_log_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
 INDEX idx_ai_log_created(created_at),
 INDEX idx_ai_log_source_status(source,status)
) ENGINE=InnoDB;

CREATE TABLE authentication_sessions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 token_hash CHAR(64) NOT NULL UNIQUE,
 user_agent VARCHAR(255) NULL,
 ip_address VARCHAR(64) NULL,
 expires_at DATETIME NOT NULL,
 revoked_at DATETIME NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_session_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_session_user(user_id,expires_at,revoked_at)
) ENGINE=InnoDB;
SET FOREIGN_KEY_CHECKS=1;
