const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Ruta pública directa para el Dashboard sin necesidad de password
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Ruta pública directa para el Dashboard de TUSGE sin posibilidad de cambiar de programa
app.get('/dashboard-tusge', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// Inicializar base de datos SQLite (soporta rutas de red compartidas)
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');
console.log(`Utilizando base de datos en: ${dbPath}`);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    db.serialize(() => {
      // Crear tabla de docentes
      db.run(`CREATE TABLE IF NOT EXISTS docentes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL
      )`);

      // Crear tabla de materias
      db.run(`CREATE TABLE IF NOT EXISTS materias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        programa TEXT NOT NULL,
        idioma_predeterminado TEXT NOT NULL
      )`);

      // Crear tabla de gestiones académicas
      db.run(`CREATE TABLE IF NOT EXISTS gestiones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        activa INTEGER DEFAULT 0
      )`);

      // Crear tabla asociativa de materia_docente_gestion
      db.run(`CREATE TABLE IF NOT EXISTS materia_docente_gestion (
        materia_id INTEGER NOT NULL,
        docente_id INTEGER NOT NULL,
        gestion_id INTEGER NOT NULL,
        PRIMARY KEY (materia_id, docente_id, gestion_id),
        FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
        FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
        FOREIGN KEY (gestion_id) REFERENCES gestiones(id) ON DELETE CASCADE
      )`);

      // Crear tabla de asistencias
      db.run(`CREATE TABLE IF NOT EXISTS asistencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL,
        docente_id INTEGER NOT NULL,
        docente_nombre TEXT NOT NULL,
        materia_id INTEGER NOT NULL,
        materia_nombre TEXT NOT NULL,
        programa TEXT NOT NULL,
        gestion_id INTEGER,
        gestion_nombre TEXT,
        dicto_clases TEXT NOT NULL,
        clase TEXT NOT NULL,
        reposicion TEXT DEFAULT 'NO',
        inicio TEXT NOT NULL,
        minutos_atraso INTEGER DEFAULT 0,
        final_clase TEXT NOT NULL,
        minutos_final INTEGER DEFAULT 0,
        idioma_dictado TEXT NOT NULL,
        comentarios TEXT,
        FOREIGN KEY (docente_id) REFERENCES docentes(id),
        FOREIGN KEY (materia_id) REFERENCES materias(id),
        FOREIGN KEY (gestion_id) REFERENCES gestiones(id)
      )`);

      // Crear tabla de usuarios
      db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )`);

      // Migraciones de base de datos
      db.run("ALTER TABLE asistencias ADD COLUMN reposicion TEXT DEFAULT 'NO'", (err) => {});
      db.run("ALTER TABLE asistencias ADD COLUMN gestion_id INTEGER", (err) => {});
      db.run("ALTER TABLE asistencias ADD COLUMN gestion_nombre TEXT", (err) => {});
      db.run("ALTER TABLE asistencias ADD COLUMN creado_por_usuario_id INTEGER", (err) => {});
      db.run("ALTER TABLE asistencias ADD COLUMN creado_por_usuario_nombre TEXT", (err) => {});
      db.run("ALTER TABLE asistencias ADD COLUMN editado_por_usuario_id INTEGER", (err) => {});
      db.run("ALTER TABLE asistencias ADD COLUMN editado_por_usuario_nombre TEXT", (err) => {});

      // Cargar gestión por defecto 'Sem II - 2026' si está vacía
      db.get("SELECT COUNT(*) as count FROM gestiones", (err, row) => {
        if (!err && row.count === 0) {
          db.run("INSERT INTO gestiones (nombre, activa) VALUES ('Sem II - 2026', 1)", (err) => {
            if (!err) console.log('Gestión por defecto Sem II - 2026 cargada y activada.');
          });
        }
      });

      // Cargar usuario administrador Jorge por defecto si está vacío
      db.get("SELECT COUNT(*) as count FROM usuarios", (err, row) => {
        if (!err && row.count === 0) {
          db.run("INSERT INTO usuarios (username, password) VALUES ('Jorge', 'logitech:1')", (err) => {
            if (!err) console.log('Usuario administrador por defecto "Jorge" creado con éxito.');
          });
        }
      });
    });
  }
});

// Helper de BD para usar Promesas
const dbQueryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Endpoints API

// 1. Obtener docentes, materias y gestiones (Datos maestros)
app.get('/api/maestros', async (req, res) => {
  try {
    const docentes = await dbQueryAll("SELECT * FROM docentes ORDER BY nombre ASC");
    
    // Obtener gestión activa
    const gestionActiva = await dbGet("SELECT id FROM gestiones WHERE activa = 1 LIMIT 1");
    const gestionActivaId = gestionActiva ? gestionActiva.id : null;
    
    let materias = [];
    if (gestionActivaId) {
      // Hacer LEFT JOIN para traer el docente asociado en la gestión activa
      materias = await dbQueryAll(`
        SELECT m.*, mdg.docente_id, d.nombre AS docente_nombre
        FROM materias m
        LEFT JOIN materia_docente_gestion mdg ON m.id = mdg.materia_id AND mdg.gestion_id = ?
        LEFT JOIN docentes d ON mdg.docente_id = d.id
        ORDER BY m.nombre ASC
      `, [gestionActivaId]);
    } else {
      materias = await dbQueryAll("SELECT * FROM materias ORDER BY nombre ASC");
    }

    const gestiones = await dbQueryAll("SELECT * FROM gestiones ORDER BY id DESC");
    res.json({ docentes, materias, gestiones });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos maestros: ' + error.message });
  }
});

// 2. Obtener todas las asistencias registradas
app.get('/api/asistencias', async (req, res) => {
  try {
    const asistencias = await dbQueryAll(`
      SELECT a.*, m.idioma_predeterminado AS materia_idioma_predeterminado 
      FROM asistencias a
      LEFT JOIN materias m ON a.materia_id = m.id
      ORDER BY a.fecha DESC, a.id DESC
    `);
    res.json(asistencias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener asistencias: ' + error.message });
  }
});

// 3. Registrar una nueva asistencia
app.post('/api/asistencias', async (req, res) => {
  const {
    fecha,
    docente_id,
    docente_nombre,
    materia_id,
    materia_nombre,
    programa,
    gestion_id,
    gestion_nombre,
    dicto_clases,
    clase,
    reposicion,
    inicio,
    minutos_atraso,
    final_clase,
    minutos_final,
    idioma_dictado,
    comentarios,
    creado_por_usuario_id,
    creado_por_usuario_nombre
  } = req.body;

  // Validaciones básicas
  if (!fecha || !docente_id || !docente_nombre || !materia_id || !materia_nombre || !programa || !gestion_id || !gestion_nombre || !dicto_clases) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para el registro.' });
  }

  const sql = `INSERT INTO asistencias (
    fecha, docente_id, docente_nombre, materia_id, materia_nombre, programa,
    gestion_id, gestion_nombre, dicto_clases, clase, reposicion, inicio, minutos_atraso, final_clase, minutos_final,
    idioma_dictado, comentarios, creado_por_usuario_id, creado_por_usuario_nombre
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [
    fecha,
    docente_id,
    docente_nombre,
    materia_id,
    materia_nombre,
    programa,
    parseInt(gestion_id),
    gestion_nombre,
    dicto_clases,
    dicto_clases === 'SI' ? clase : 'N/A',
    dicto_clases === 'SI' ? (reposicion || 'NO') : 'N/A',
    dicto_clases === 'SI' ? inicio : 'N/A',
    dicto_clases === 'SI' && inicio === 'Con Retraso' ? parseInt(minutos_atraso) || 0 : 0,
    dicto_clases === 'SI' ? final_clase : 'N/A',
    dicto_clases === 'SI' && final_clase !== 'Puntual' ? parseInt(minutos_final) || 0 : 0,
    dicto_clases === 'SI' ? idioma_dictado : 'N/A',
    comentarios || '',
    creado_por_usuario_id ? parseInt(creado_por_usuario_id) : null,
    creado_por_usuario_nombre || null
  ];

  try {
    const result = await dbRun(sql, params);
    res.status(201).json({ mensaje: 'Asistencia registrada con éxito', id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la asistencia: ' + error.message });
  }
});

// 4. Eliminar una asistencia registrada (por seguridad o corrección)
app.delete('/api/asistencias/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun("DELETE FROM asistencias WHERE id = ?", [id]);
    res.json({ mensaje: 'Registro de asistencia eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la asistencia: ' + error.message });
  }
});

// 5. Agregar un docente
app.post('/api/docentes', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del docente es obligatorio.' });
  }
  try {
    const result = await dbRun("INSERT INTO docentes (nombre) VALUES (?)", [nombre]);
    res.status(201).json({ id: result.lastID, nombre });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar docente: ' + error.message });
  }
});

// 6. Eliminar un docente
app.delete('/api/docentes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun("DELETE FROM docentes WHERE id = ?", [id]);
    res.json({ mensaje: 'Docente eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar docente: ' + error.message });
  }
});

// 7. Agregar una materia
app.post('/api/materias', async (req, res) => {
  const { nombre, programa, idioma_predeterminado, docente_id } = req.body;
  if (!nombre || !programa || !idioma_predeterminado) {
    return res.status(400).json({ error: 'El nombre, programa e idioma son obligatorios.' });
  }
  try {
    const result = await dbRun(
      "INSERT INTO materias (nombre, programa, idioma_predeterminado) VALUES (?, ?, ?)",
      [nombre, programa, idioma_predeterminado]
    );
    const materiaId = result.lastID;

    // Obtener gestión activa
    const gestionActiva = await dbGet("SELECT id FROM gestiones WHERE activa = 1 LIMIT 1");
    const gestionActivaId = gestionActiva ? gestionActiva.id : null;

    if (docente_id && gestionActivaId) {
      await dbRun(
        "INSERT OR IGNORE INTO materia_docente_gestion (materia_id, docente_id, gestion_id) VALUES (?, ?, ?)",
        [materiaId, parseInt(docente_id), gestionActivaId]
      );
    }

    res.status(201).json({ id: materiaId, nombre, programa, idioma_predeterminado, docente_id });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar materia: ' + error.message });
  }
});

// 8. Eliminar una materia
app.delete('/api/materias/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun("DELETE FROM materias WHERE id = ?", [id]);
    res.json({ mensaje: 'Materia eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar materia: ' + error.message });
  }
});

// 9. Editar un docente
app.put('/api/docentes/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del docente es obligatorio.' });
  }
  try {
    await dbRun("UPDATE docentes SET nombre = ? WHERE id = ?", [nombre, id]);
    // Asegurar consistencia actualizando el nombre del docente desnormalizado en la tabla asistencias
    await dbRun("UPDATE asistencias SET docente_nombre = ? WHERE docente_id = ?", [nombre, id]);
    res.json({ mensaje: 'Docente actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar docente: ' + error.message });
  }
});

// 9b. Carga masiva de docentes
app.post('/api/docentes/bulk', async (req, res) => {
  const { nombres } = req.body;
  if (!nombres || !Array.isArray(nombres) || nombres.length === 0) {
    return res.status(400).json({ error: 'La lista de nombres es obligatoria y debe ser un array.' });
  }
  try {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      const stmt = db.prepare("INSERT INTO docentes (nombre) VALUES (?)");
      nombres.forEach(n => {
        if (n && n.trim()) stmt.run(n.trim());
      });
      stmt.finalize();
      db.run("COMMIT", (err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: 'Error al confirmar carga masiva: ' + err.message });
        }
        res.status(201).json({ mensaje: `${nombres.length} docentes agregados con éxito.` });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en la carga masiva de docentes: ' + error.message });
  }
});

// 10. Editar una materia
app.put('/api/materias/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, programa, idioma_predeterminado, docente_id } = req.body;
  if (!nombre || !programa || !idioma_predeterminado) {
    return res.status(400).json({ error: 'El nombre, programa e idioma predeterminado son obligatorios.' });
  }
  try {
    await dbRun(
      "UPDATE materias SET nombre = ?, programa = ?, idioma_predeterminado = ? WHERE id = ?",
      [nombre, programa, idioma_predeterminado, id]
    );

    // Asegurar consistencia actualizando el nombre y programa de la materia desnormalizados en la tabla asistencias
    await dbRun(
      "UPDATE asistencias SET materia_nombre = ?, programa = ? WHERE materia_id = ?",
      [nombre, programa, id]
    );

    // Obtener gestión activa
    const gestionActiva = await dbGet("SELECT id FROM gestiones WHERE activa = 1 LIMIT 1");
    const gestionActivaId = gestionActiva ? gestionActiva.id : null;

    if (gestionActivaId) {
      // Eliminar relación previa en esta gestión y crear la nueva
      await dbRun(
        "DELETE FROM materia_docente_gestion WHERE materia_id = ? AND gestion_id = ?",
        [id, gestionActivaId]
      );
      if (docente_id) {
        await dbRun(
          "INSERT OR IGNORE INTO materia_docente_gestion (materia_id, docente_id, gestion_id) VALUES (?, ?, ?)",
          [id, parseInt(docente_id), gestionActivaId]
        );
      }
    }

    res.json({ mensaje: 'Materia actualizada con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar materia: ' + error.message });
  }
});

// 10b. Carga masiva de materias
app.post('/api/materias/bulk', async (req, res) => {
  const { materias } = req.body;
  if (!materias || !Array.isArray(materias) || materias.length === 0) {
    return res.status(400).json({ error: 'La lista de materias es obligatoria y debe ser un array.' });
  }
  try {
    // Obtener gestión activa e ID de Profesor ePC
    const epcTeacher = await dbGet("SELECT id FROM docentes WHERE nombre = 'Profesor ePC' LIMIT 1");
    const epcTeacherId = epcTeacher ? epcTeacher.id : null;
    
    const gestionActiva = await dbGet("SELECT id FROM gestiones WHERE activa = 1 LIMIT 1");
    const gestionActivaId = gestionActiva ? gestionActiva.id : null;

    await dbRun("BEGIN TRANSACTION");
    for (const m of materias) {
      if (m.nombre && m.nombre.trim()) {
        const result = await dbRun(
          "INSERT INTO materias (nombre, programa, idioma_predeterminado) VALUES (?, ?, ?)",
          [m.nombre.trim(), m.programa, m.idioma_predeterminado]
        );
        
        if (epcTeacherId && gestionActivaId) {
          await dbRun(
            "INSERT OR IGNORE INTO materia_docente_gestion (materia_id, docente_id, gestion_id) VALUES (?, ?, ?)",
            [result.lastID, epcTeacherId, gestionActivaId]
          );
        }
      }
    }
    await dbRun("COMMIT");
    res.status(201).json({ mensaje: `${materias.length} materias agregadas y asociadas con éxito.` });
  } catch (error) {
    try { await dbRun("ROLLBACK"); } catch (e) {}
    res.status(500).json({ error: 'Error en la carga masiva de materias: ' + error.message });
  }
});

// 11. Editar un registro de asistencia
app.put('/api/asistencias/:id', async (req, res) => {
  const { id } = req.params;
  const {
    fecha,
    docente_id,
    docente_nombre,
    materia_id,
    materia_nombre,
    programa,
    gestion_id,
    gestion_nombre,
    dicto_clases,
    clase,
    reposicion,
    inicio,
    minutos_atraso,
    final_clase,
    minutos_final,
    idioma_dictado,
    comentarios,
    editado_por_usuario_id,
    editado_por_usuario_nombre
  } = req.body;

  if (!fecha || !docente_id || !docente_nombre || !materia_id || !materia_nombre || !programa || !gestion_id || !gestion_nombre || !dicto_clases) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para actualizar el registro.' });
  }

  const sql = `UPDATE asistencias SET
    fecha = ?,
    docente_id = ?,
    docente_nombre = ?,
    materia_id = ?,
    materia_nombre = ?,
    programa = ?,
    gestion_id = ?,
    gestion_nombre = ?,
    dicto_clases = ?,
    clase = ?,
    reposicion = ?,
    inicio = ?,
    minutos_atraso = ?,
    final_clase = ?,
    minutos_final = ?,
    idioma_dictado = ?,
    comentarios = ?,
    editado_por_usuario_id = ?,
    editado_por_usuario_nombre = ?
    WHERE id = ?`;

  const params = [
    fecha,
    docente_id,
    docente_nombre,
    materia_id,
    materia_nombre,
    programa,
    parseInt(gestion_id),
    gestion_nombre,
    dicto_clases,
    dicto_clases === 'SI' ? clase : 'N/A',
    dicto_clases === 'SI' ? (reposicion || 'NO') : 'N/A',
    dicto_clases === 'SI' ? inicio : 'N/A',
    dicto_clases === 'SI' && inicio === 'Con Retraso' ? parseInt(minutos_atraso) || 0 : 0,
    dicto_clases === 'SI' ? final_clase : 'N/A',
    dicto_clases === 'SI' && final_clase !== 'Puntual' ? parseInt(minutos_final) || 0 : 0,
    dicto_clases === 'SI' ? idioma_dictado : 'N/A',
    comentarios || '',
    editado_por_usuario_id ? parseInt(editado_por_usuario_id) : null,
    editado_por_usuario_nombre || null,
    id
  ];

  try {
    await dbRun(sql, params);
    res.json({ mensaje: 'Asistencia actualizada con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar asistencia: ' + error.message });
  }
});

// --- Endpoints de Autenticación & Usuarios ---

// Login de Usuario
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
  }
  try {
    const user = await dbGet("SELECT * FROM usuarios WHERE username = ? AND password = ?", [username.trim(), password]);
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    res.json({ id: user.id, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión: ' + error.message });
  }
});

// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const users = await dbQueryAll("SELECT id, username FROM usuarios ORDER BY username ASC");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios: ' + error.message });
  }
});

// Crear nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
  }
  try {
    const userExists = await dbGet("SELECT id FROM usuarios WHERE username = ?", [username.trim()]);
    if (userExists) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
    }
    const result = await dbRun("INSERT INTO usuarios (username, password) VALUES (?, ?)", [username.trim(), password]);
    res.status(201).json({ id: result.lastID, username: username.trim() });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario: ' + error.message });
  }
});

// Eliminar un usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Proteger para no eliminar al usuario "Jorge" (ID 1)
    if (parseInt(id) === 1) {
      return res.status(400).json({ error: 'No es posible eliminar al administrador principal "Jorge".' });
    }
    
    // Validar cantidad de usuarios restante
    const countRow = await dbGet("SELECT COUNT(*) as count FROM usuarios");
    if (countRow.count <= 1) {
      return res.status(400).json({ error: 'No se puede eliminar el único usuario restante.' });
    }

    await dbRun("DELETE FROM usuarios WHERE id = ?", [id]);
    res.json({ mensaje: 'Usuario eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario: ' + error.message });
  }
});

// Cambiar contraseña de un usuario
app.post('/api/usuarios/change-password', async (req, res) => {
  const { usuario_id, password_actual, password_nueva } = req.body;
  if (!usuario_id || !password_actual || !password_nueva) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }
  try {
    const user = await dbGet("SELECT * FROM usuarios WHERE id = ?", [usuario_id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    if (user.password !== password_actual) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }
    if (password_nueva.trim().length < 4) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres.' });
    }
    await dbRun("UPDATE usuarios SET password = ? WHERE id = ?", [password_nueva.trim(), usuario_id]);
    res.json({ mensaje: 'Contraseña actualizada con éxito.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar contraseña: ' + error.message });
  }
});

// 12. Agregar una gestión académica
app.post('/api/gestiones', async (req, res) => {
  const { nombre, activa } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la gestión académica es obligatorio.' });
  }
  try {
    db.serialize(async () => {
      // Si se define como activa, desactivamos las demás
      if (activa) {
        await dbRun("UPDATE gestiones SET activa = 0");
      }
      const result = await dbRun(
        "INSERT INTO gestiones (nombre, activa) VALUES (?, ?)",
        [nombre, activa ? 1 : 0]
      );
      res.status(201).json({ id: result.lastID, nombre, activa: activa ? 1 : 0 });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar gestión académica: ' + error.message });
  }
});

// 13. Activar una gestión académica
app.put('/api/gestiones/:id/activar', async (req, res) => {
  const { id } = req.params;
  try {
    db.serialize(async () => {
      await dbRun("UPDATE gestiones SET activa = 0");
      await dbRun("UPDATE gestiones SET activa = 1 WHERE id = ?", [id]);
      res.json({ mensaje: 'Gestión académica activada con éxito' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al activar la gestión académica: ' + error.message });
  }
});

// 14. Eliminar una gestión académica
app.delete('/api/gestiones/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun("DELETE FROM gestiones WHERE id = ?", [id]);
    res.json({ mensaje: 'Gestión académica eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar gestión académica: ' + error.message });
  }
});

const os = require('os');

function getLocalIpAddresses() {
  const ipList = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if ((iface.family === 'IPv4' || iface.family === 4) && !iface.internal) {
        ipList.push({ name, address: iface.address });
      }
    }
  }
  return ipList;
}

// Levantar servidor escuchando en todas las interfaces de red (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  console.log(`\n======================================================`);
  console.log(`Servidor de ePC Asistencia iniciado correctamente.`);
  console.log(`- Acceso Local:      http://localhost:${PORT}`);
  console.log(`- Acceso Red Local (LAN / VPN):`);
  if (ips.length > 0) {
    ips.forEach(ip => {
      let label = 'Red Física';
      if (ip.name.toLowerCase().includes('tailscale') || ip.address.startsWith('100.')) {
        label = 'VPN / Tailscale';
      } else if (ip.name.toLowerCase().includes('vbox') || ip.name.toLowerCase().includes('virtual')) {
        label = 'VirtualBox / Máquina Virtual';
      }
      console.log(`  * http://${ip.address}:${PORT}  (${label})`);
    });
  } else {
    console.log(`  * http://localhost:${PORT}`);
  }
  console.log(`======================================================\n`);
});
