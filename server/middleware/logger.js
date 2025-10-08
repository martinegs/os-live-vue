/**
 * Middleware minimalista para registrar peticiones HTTP.
 */
export function httpLogger() {
  return (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const elapsed = Date.now() - start;
      console.log(
        `[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${elapsed}ms)`
      );
    });
    next();
  };
}

