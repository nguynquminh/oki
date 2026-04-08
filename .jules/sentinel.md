## 2026-03-28 - [Critical] Hardcoded MongoDB Credentials in Source Code
**Vulnerability:** A hardcoded MongoDB connection string containing database credentials (username and password) was found in `mimi/src/database/connection.js`.
**Learning:** Hardcoding credentials inside the source code is a critical security vulnerability that could lead to unauthorized access to the database if the source code is compromised or exposed.
**Prevention:** Use environment variables (e.g., `MONGODB_URI`) to provide sensitive credentials at runtime. Never commit secrets to version control. Validate that the environment variables are set before trying to connect to external services.
