export interface Settings {
    settingKey: string;
    accessTokenLifetime: number;  // NEVER send this back to the client
    refreshTokenLifetime: number;

}

//*pending : make refreshTokenLifetime string as we r planning to save it as '7d' for 7 days
