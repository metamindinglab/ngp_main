// Load test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://your_user:your_password@localhost:5432/roblox_asset_management_test"; 