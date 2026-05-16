// src/services/RefreshTokenService.ts
import { EntityManager, Repository } from 'typeorm';
import { RefreshToken } from '../entity/RefreshToken'; // Import the RefreshToken entity

export class RefreshTokenService {
    private refreshTokenRepository!: Repository<RefreshToken>; // Will be set by init method

    constructor() {
        // Constructor is lean, repository will be injected via init method
    }

    /**
     * Initializes the RefreshTokenService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed
     * in your central dependency initializer (e.g., dependencies.ts).
     * @param repo The TypeORM Repository instance for RefreshToken.
     */
    async init(repo: Repository<RefreshToken>): Promise<void> {
        this.refreshTokenRepository = repo;
        console.log("RefreshTokenService repository initialized.");
    }

    /**
     * Saves a new refresh token or updates an existing one.
     * TypeORM handles insert/update based on primary key presence.
     * @param refreshToken The RefreshToken entity to save.
     * @returns The saved RefreshToken entity.
     */
    async save(refreshToken: RefreshToken
        ,manager?: EntityManager ): Promise<RefreshToken> {
      
        
        if (!this.refreshTokenRepository) {
            throw new Error("RefreshTokenService repository not initialized. Call init() first.");
        }
        
        const refreshTokenRepository = manager ? manager.getRepository(RefreshToken) : this.refreshTokenRepository;

        try {
         
            return await refreshTokenRepository.save(refreshToken);
        } catch (error: any) {
            console.error('Error saving refresh token:', error);
            throw error;
        }
    }

    
    /**
     * Finds a refresh token by its unique token string.
     * @param token The unique token string of the refresh token.
     * @returns The RefreshToken entity, or undefined if not found.
     */
    async findByToken(token: string
        ,manager?: EntityManager): Promise<RefreshToken | undefined> {
        
        if (!this.refreshTokenRepository) {
            throw new Error("RefreshTokenService repository not initialized. Call init() first.");
        }
        const refreshTokenRepository = manager ? manager.getRepository(RefreshToken) : this.refreshTokenRepository;
        try {
            var atoken= await this.refreshTokenRepository.findOne({ where: { token: token } });
            if(atoken){
                return atoken
            }
            else undefined;
            
        } catch (error: any) {
            console.error('Error finding refresh token by token string:', error);
            throw error;
        }
    }

    /**
     * Deletes a refresh token by its unique token string.
     * @param token The unique token string of the refresh token to delete.
     */
    async deleteByToken(token: string
        ,manager?: EntityManager): Promise<void> {
        if (!this.refreshTokenRepository) {
            throw new Error("RefreshTokenService repository not initialized. Call init() first.");
        }
        const refreshTokenRepository = manager ? manager.getRepository(RefreshToken) : this.refreshTokenRepository;

        try {
            await this.refreshTokenRepository.delete({ token: token });
            console.log(`yes Refresh token '${token}' deleted from DB.`);
        } catch (error: any) {
            console.error('Error deleting refresh token by token string:', error);
            throw error;
        }
    }

    /**
     * Deletes an existing token for a specific user and device.
     * This ensures only one active session per user per device.
     * @param userId The ID of the user.
     * @param deviceInfo The device information string.
     */
    async deleteExistingTokenForDevice(userId: number, deviceInfo: string
        ,manager?: EntityManager): Promise<void> {
        if (!this.refreshTokenRepository) {
            throw new Error("RefreshTokenService repository not initialized. Call init() first.");
        }
        const refreshTokenRepository = manager ? manager.getRepository(RefreshToken) : this.refreshTokenRepository;
        try {
            const deleteResult = await this.refreshTokenRepository.delete({
                userId: userId,
                deviceInfo: deviceInfo,
            });
            if (deleteResult.affected && deleteResult.affected > 0) {
                //console.log(`Cleaned up ${deleteResult.affected} old refresh token(s) for user ${userId} on device ${deviceInfo}.`);
            } else {
                console.log(`No existing refresh token found for user ${userId} on device ${deviceInfo}.`);
            }
        } catch (error: any) {
            console.error(`Error deleting existing token for user ${userId} on device ${deviceInfo}:`, error);
            throw error;
        }
    }

    /**
     * Deletes all expired refresh tokens from the database.
     * Call this periodically (e.g., via a cron job).
     */
    async deleteAllExpiredTokens(
        manager?: EntityManager): Promise<void> {
        if (!this.refreshTokenRepository) {
            throw new Error("RefreshTokenService repository not initialized. Call init() first.");
        }
        const refreshTokenRepository = manager ? manager.getRepository(RefreshToken) : this.refreshTokenRepository;

        try {
            await this.refreshTokenRepository.createQueryBuilder()
                .delete()
                .where("expiresAt <= :now", { now: new Date() })
                .execute();
            console.log('All expired refresh tokens cleaned up from DB.');
        } catch (error: any) {
            console.error('Error deleting all expired tokens:', error);
            // Don't re-throw for a cleanup job, just log
        }
    }

    /**
     * Deletes all expired refresh tokens for a given user.
     * Useful for cleanup for a specific user's sessions.
     * @param userId The ID of the user.
     */
    async deleteExpiredTokensForUser(userId: number
        ,manager?: EntityManager): Promise<void> {
        if (!this.refreshTokenRepository) {
            throw new Error("RefreshTokenService repository not initialized. Call init() first.");
        }
        const refreshTokenRepository = manager ? manager.getRepository(RefreshToken) : this.refreshTokenRepository;
        try {
            await this.refreshTokenRepository.createQueryBuilder()
                .delete()
                .where("userId = :userId", { userId })
                .andWhere("expiresAt <= :now", { now: new Date() })
                .execute();
            console.log(`Expired refresh tokens for user ${userId} cleaned up from DB.`);
        } catch (error: any) {
            console.error('Error deleting expired tokens for user:', error);
            throw error;
        }
    }
}

export default RefreshTokenService; // Export the class