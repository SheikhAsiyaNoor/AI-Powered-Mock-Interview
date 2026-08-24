/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specified roles and logs unauthorized attempts
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required." });
        }

        const userRole = req.user.role || "student";

        if (!allowedRoles.includes(userRole)) {
            // Log security warning for unauthorized access attempt
            console.warn(`[RBAC UNAUTHORIZED] User ${req.user.email} (Role: ${userRole}) attempted to access ${req.originalUrl} requiring roles: [${allowedRoles.join(", ")}]`);

            if (req.user.securityAlerts) {
                req.user.securityAlerts.push({
                    alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: "UNAUTHORIZED_ACCESS_ATTEMPT",
                    message: `Attempted to access restricted resource (${req.originalUrl}) requiring [${allowedRoles.join(", ")}]`,
                    severity: "medium",
                    timestamp: new Date()
                });
                req.user.save().catch(err => console.error("Error logging security alert:", err));
            }

            return res.status(403).json({
                message: `Access denied. Role '${userRole}' does not have sufficient permissions to perform this action.`,
                requiredRoles: allowedRoles,
                currentRole: userRole
            });
        }

        next();
    };
};

const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required." });
        }

        // Admin has all permissions automatically
        if (req.user.role === "admin") {
            return next();
        }

        const userPermissions = req.user.customPermissions || [];
        if (!userPermissions.includes(requiredPermission)) {
            return res.status(403).json({
                message: `Access denied. Missing required permission: '${requiredPermission}'.`,
                currentRole: req.user.role
            });
        }

        next();
    };
};

module.exports = { authorizeRoles, checkPermission };
