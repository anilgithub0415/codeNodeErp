export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: any, res: any, next: any) => {
        // req.user is populated by your JWT/Passport authentication middleware
        const userRole = req.user?.roleName; 

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
        }
        next();
    };
};