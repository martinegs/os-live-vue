import mysql from "mysql2/promise";
import { config } from "./config.js";

/**
 * Pool de conexiones MySQL compartido por los servicios.
 */
export const pool = mysql.createPool(config.database);

export async function verifyConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("[DB] Conexion establecida");
  } catch (error) {
    console.error("[DB] Error al conectar", error);
  }
}

