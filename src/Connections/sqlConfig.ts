import { ConnectionPool, config, connect } from 'mssql';
import * as dotenv from 'dotenv'; // Import dotenv

// Load environment variables from .env file during local development
// This should be at the very top of your application's entry point (e.g., index.ts, app.ts)
// For this example, we'll put it here for clarity, but ideally it's loaded once at app start.
dotenv.config();

const dbConfig: config = {
    // Access credentials from environment variables
    server: process.env.DB_SERVER || '', // Fallback for local dev if not set
    database: process.env.DB_DATABASE ,
    authentication: {
        type: 'default',
        options: {
            userName: process.env.DB_USER , // Fallback for local dev
            password: process.env.DB_PASSWORD  // Fallback for local dev
        }
    },
    options: {
        trustServerCertificate: (process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'), // Convert string to boolean
        encrypt: (process.env.DB_ENCRYPT === 'true')
    },
};

class Database {
    private pool: ConnectionPool | null = null;

    async connect(): Promise<ConnectionPool> {
        if (this.pool) {
            return this.pool;
        }
        try {
            // Use the environment-variable-driven dbConfig
            this.pool = await connect(dbConfig);
            console.log('Database connected successfully.'); // Add a success log
            return this.pool;
        } catch (err) {
            console.error('Database connection failed:', err);
            throw err;
        }
    }

    async disconnect(): Promise<void> {
        if (this.pool) {
            try {
                await this.pool.close();
                this.pool = null;
                console.log('Database disconnected.'); // Add a success log
            } catch (err) {
                console.error("Error disconnecting from database", err);
            }
        }
    }

    async getPool(): Promise<ConnectionPool> {
        if (!this.pool) {
            await this.connect();
        }
        return this.pool!;
    }
}

const db = new Database();

// Export only the necessary instance, not the raw config object
export { db };