-- Create databases for each microservice
CREATE DATABASE IF NOT EXISTS `kabi_user` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `kabi_board` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `kabi_task` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `kabi_notification` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user for each service
CREATE USER IF NOT EXISTS 'kabi_user'@'%' IDENTIFIED BY 'kabi_password';
CREATE USER IF NOT EXISTS 'kabi_board'@'%' IDENTIFIED BY 'kabi_password';
CREATE USER IF NOT EXISTS 'kabi_task'@'%' IDENTIFIED BY 'kabi_password';
CREATE USER IF NOT EXISTS 'kabi_notification'@'%' IDENTIFIED BY 'kabi_password';

-- Grant privileges for each service user to their respective database
GRANT ALL PRIVILEGES ON `kabi_user`.* TO 'kabi_user'@'%';
GRANT ALL PRIVILEGES ON `kabi_board`.* TO 'kabi_board'@'%';
GRANT ALL PRIVILEGES ON `kabi_task`.* TO 'kabi_task'@'%';
GRANT ALL PRIVILEGES ON `kabi_notification`.* TO 'kabi_notification'@'%';

-- Grant cross-service read access (for service communication)
-- User service needs to read user data for authentication
GRANT SELECT ON `kabi_user`.* TO 'kabi_board'@'%';
GRANT SELECT ON `kabi_user`.* TO 'kabi_task'@'%';
GRANT SELECT ON `kabi_user`.* TO 'kabi_notification'@'%';

-- Board service needs to be accessed by task and notification services
GRANT SELECT ON `kabi_board`.* TO 'kabi_task'@'%';
GRANT SELECT ON `kabi_board`.* TO 'kabi_notification'@'%';

-- Task service needs to be accessed by notification service
GRANT SELECT ON `kabi_task`.* TO 'kabi_notification'@'%';

-- Refresh privileges
FLUSH PRIVILEGES;

-- Display created databases
SHOW DATABASES;