import express from "express";
import { createUserService } from "../services/userService.js";
import { config } from "../config.js";
import jwt from "jsonwebtoken";

export function createAuthRouter({ pool }) {
  const router = express.Router();
  const userService = createUserService({ pool, usersTable: config.tables.users || "usuarios" });

  // POST /api/auth/login
  router.post("/login", async (req, res, next) => {
    try {
      const { email, senha } = req.body || {};
      // Bypass temporal: usuario admin/admin
      if (email === 'admin' && senha === 'admin') {
        return res.json({ result: true, user: { email: 'admin', nome: 'Administrador', idUsuarios: 0, permisos_id: 99 }, token: 'admin-dev-token' });
      }
      // Diagnostic: log attempt metadata (no passwords)
      try {
        const ip = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'unknown';
        console.log(`[auth] login attempt email=${email || '<missing>'} ip=${ip}`);
      } catch (e) {}

      if (!email || !senha) {
        console.log('[auth] bad request: missing email or senha');
        return res.status(400).json({ result: false, message: "Email y senha son requeridos" });
      }

      const user = await userService.findByEmail(email);
      if (!user) {
        console.log(`[auth] user not found for email=${email}`);
        return res.status(401).json({ result: false, message: "Credenciales invalidas" });
      }

      const ok = await userService.verifyPassword(user, senha);
      console.log(`[auth] verifyPassword result for user id=${user.idUsuarios || user.id || 'unknown'} => ${ok}`);
      if (!ok) {
        return res.status(401).json({ result: false, message: "Credenciales invalidas" });
      }

      // Retornamos un minimal user object sin la senha
      const safeUser = { ...user };
      delete safeUser.senha;

      // Si hay secret, emitimos un JWT
      if (config.auth && config.auth.jwtSecret) {
        const token = jwt.sign({ sub: user.idUsuarios || user.id || user.id_usuario || user.idUsers || user.idUsuarios }, { secret: config.auth.jwtSecret }, { expiresIn: '8h' });
        return res.json({ result: true, user: safeUser, token });
      }

      return res.json({ result: true, user: safeUser });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
