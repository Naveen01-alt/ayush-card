"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../lib/db");
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        };
        const token = (0, auth_1.signToken)(payload);
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 1000 // 24 hours
        });
        res.json({ user: payload });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        if (!email || !password || !name || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await db_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
            }
        });
        // Automatically create profile based on role
        if (role === 'PATIENT') {
            const ayushId = `AYUSH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            await db_1.prisma.patientProfile.create({
                data: {
                    userId: user.id,
                    ayushId,
                    qrToken: `qr-${user.id}-${Date.now()}`
                }
            });
        }
        else if (role === 'DOCTOR') {
            await db_1.prisma.doctorProfile.create({
                data: {
                    userId: user.id,
                    licenseNumber: `LIC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                    specialization: 'General',
                    hospitalName: 'AYUSH General Hospital'
                }
            });
        }
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        };
        const token = (0, auth_1.signToken)(payload);
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 1000
        });
        res.status(201).json({ user: payload });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ message: 'Logged out successfully' });
});
exports.default = router;
//# sourceMappingURL=auth.js.map