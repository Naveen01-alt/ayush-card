"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// We can add health records logic here in the future
router.get('/', (req, res) => {
    res.json({ message: 'Records route placeholder' });
});
exports.default = router;
//# sourceMappingURL=records.js.map