export function createAttendanceService(pool) {
  /**
   * Obtiene el estado de asistencia de todos los usuarios con idAsistencias
   * @param {string} date - Fecha en formato YYYY-MM-DD (default: hoy)
   * @returns {Promise<Array>} Lista de usuarios con su estado de asistencia
   */
  async function fetchDailyAttendance(date = null) {
    const targetDate = date || new Date().toISOString().slice(0, 10);

    // Obtener usuarios con idAsistencias != 0
    const [usuarios] = await pool.query(
      `SELECT idUsuarios, nome, email, idAsistencias 
       FROM usuarios 
       WHERE idAsistencias IS NOT NULL AND idAsistencias != 0
       ORDER BY nome`
    );

    if (usuarios.length === 0) {
      return {
        date: targetDate,
        totalUsuarios: 0,
        presentes: 0,
        ausentes: 0,
        sinRegistro: 0,
        usuarios: [],
      };
    }

    // Obtener asistencias del día usando idUsuario
    const idUsuariosList = usuarios.map(u => u.idAsistencias);
    const [asistencias] = await pool.query(
      `SELECT idUsuario, fecha, horaEntrada, horaSalida 
       FROM asistencias 
       WHERE idUsuario IN (?) AND DATE(fecha) = ?`,
      [idUsuariosList, targetDate]
    );

    // Crear mapa de asistencias por idUsuario
    const asistenciasMap = new Map();
    for (const asistencia of asistencias) {
      asistenciasMap.set(asistencia.idUsuario, {
        horaEntrada: asistencia.horaEntrada,
        horaSalida: asistencia.horaSalida,
      });
    }

    // Combinar datos
    const result = usuarios.map(usuario => {
      const hasRecord = asistenciasMap.has(usuario.idAsistencias);
      
      return {
        id: usuario.idUsuarios,
        nombre: usuario.nome,
        email: usuario.email,
        idAsistencias: usuario.idAsistencias,
        estado: hasRecord ? 'Presente' : 'Ausente',
        presente: hasRecord,
        horaEntrada: hasRecord ? asistenciasMap.get(usuario.idAsistencias).horaEntrada : null,
        horaSalida: hasRecord ? asistenciasMap.get(usuario.idAsistencias).horaSalida : null,
      };
    });

    // Calcular totales
    const totalUsuarios = result.length;
    const presentes = result.filter(u => u.estado === 'Presente').length;
    const ausentes = result.filter(u => u.estado === 'Ausente').length;

    return {
      date: targetDate,
      totalUsuarios,
      presentes,
      ausentes,
      sinRegistro: 0,
      usuarios: result,
    };
  }

  return { fetchDailyAttendance };
}
