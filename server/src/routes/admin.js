const express = require("express");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/rbac");
const {
    getPlatformAnalytics,
    getUsersList,
    updateUserRole,
    unlockUserAccount,
    deleteUserAccount,
    getSystemSettings,
    updateSystemSettings,
    getSecurityAuditLogs
} = require("../controllers/adminController");

const router = express.Router();

// Strictly protect all admin routes to role: 'admin'
router.use(protect);
router.use(authorizeRoles("admin"));

router.get("/analytics", getPlatformAnalytics);
router.get("/users", getUsersList);
router.patch("/users/:id/role", updateUserRole);
router.post("/users/:id/unlock", unlockUserAccount);
router.delete("/users/:id", deleteUserAccount);
router.get("/settings", getSystemSettings);
router.put("/settings", updateSystemSettings);
router.get("/audit-logs", getSecurityAuditLogs);

module.exports = router;
