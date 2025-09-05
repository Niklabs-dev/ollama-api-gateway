// server.js
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración
const OLLAMA_HOST =
  process.env.OLLAMA_HOST || "http://IP_DE_TU_VM_OLLAMA:11434";
const API_KEYS = process.env.API_KEYS
  ? process.env.API_KEYS.split(",")
  : ["tu-api-key-super-secreta"];

// Middleware de seguridad
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: { error: "Demasiadas peticiones, intenta más tarde" },
});
app.use(limiter);

// Middleware de autenticación
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autorización requerido" });
  }

  const token = authHeader.substring(7);

  if (!API_KEYS.includes(token)) {
    return res.status(401).json({ error: "Token inválido" });
  }

  next();
};

// Middleware de logging
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`
  );
  next();
});

// Ruta de health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Proxy para /api/chat
app.post("/api/chat", authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${OLLAMA_HOST}/api/chat`, req.body, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 120000, // 2 minutos timeout
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error al contactar Ollama:", error.message);

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({ error: "Servicio Ollama no disponible" });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Proxy para /api/generate
app.post("/api/generate", authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, req.body, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 120000,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error al contactar Ollama:", error.message);

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({ error: "Servicio Ollama no disponible" });
    }

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Listar modelos disponibles
app.get("/api/tags", authenticate, async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_HOST}/api/tags`);
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener modelos:", error.message);
    res.status(500).json({ error: "Error al obtener modelos" });
  }
});

// Ruta para streaming (WebSocket proxy sería mejor, pero esto funciona)
app.post("/api/chat/stream", authenticate, async (req, res) => {
  try {
    const response = await axios.post(
      `${OLLAMA_HOST}/api/chat`,
      { ...req.body, stream: true },
      {
        headers: { "Content-Type": "application/json" },
        responseType: "stream",
      }
    );

    res.setHeader("Content-Type", "text/plain");
    response.data.pipe(res);
  } catch (error) {
    console.error("Error en streaming:", error.message);
    res.status(500).json({ error: "Error en streaming" });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint no encontrado" });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API Gateway corriendo en puerto ${PORT}`);
  console.log(`🔒 Autenticación habilitada`);
  console.log(`🎯 Ollama host: ${OLLAMA_HOST}`);
});
