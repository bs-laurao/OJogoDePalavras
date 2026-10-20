import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createRound, publicRound, submitGuess } from "./src/game-engine.js";

const publicDirectory = fileURLToPath(new URL("./public/", import.meta.url));
const rounds = new Map();
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1024) throw new Error("body_too_large");
  }

  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new Error("invalid_json");
  }
}

async function serveStatic(pathname, response) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return false;
  }

  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const filePath = resolve(publicDirectory, `.${requestedPath}`);
  if (!filePath.startsWith(`${resolve(publicDirectory)}${sep}`)) return false;

  try {
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) return false;
    response.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-cache",
      "x-content-type-options": "nosniff"
    });
    createReadStream(filePath).pipe(response);
    return true;
  } catch {
    return false;
  }
}

export function createAppServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    const route = url.pathname.match(/^\/api\/rounds\/([^/]+)(?:\/guesses)?$/);

    try {
      if (request.method === "POST" && url.pathname === "/api/rounds") {
        const round = createRound();
        rounds.set(round.id, round);
        sendJson(response, 201, publicRound(round));
        return;
      }

      if (route) {
        const round = rounds.get(route[1]);
        if (!round) {
          sendJson(response, 404, { error: { code: "round_not_found", message: "Rodada não encontrada." } });
          return;
        }

        if (request.method === "GET" && !url.pathname.endsWith("/guesses")) {
          sendJson(response, 200, publicRound(round));
          return;
        }

        if (request.method === "POST" && url.pathname.endsWith("/guesses")) {
          const body = await readJson(request);
          if (typeof body.word !== "string" || body.word.length > 32) {
            sendJson(response, 400, { error: { code: "invalid_format", message: "Digite uma palavra com até 32 letras." } });
            return;
          }

          const result = submitGuess(round, body.word);
          if (result.error) {
            const errors = {
              round_finished: [409, "round_finished", "Esta rodada já terminou."],
              invalid_format: [400, "invalid_format", "Use apenas letras neste palpite."],
              unknown_word: [422, "unknown_word", "Essa palavra ainda não está no vocabulário desta versão."],
              duplicate_guess: [409, "duplicate_guess", "Você já tentou essa palavra nesta rodada."]
            };
            const [status, code, message] = errors[result.error];
            sendJson(response, status, { error: { code, message } });
            return;
          }

          sendJson(response, 200, publicRound(round));
          return;
        }

        sendJson(response, 405, { error: { code: "method_not_allowed", message: "Método não permitido." } });
        return;
      }

      if (request.method === "GET" && await serveStatic(url.pathname, response)) return;
      sendJson(response, 404, { error: { code: "not_found", message: "Página não encontrada." } });
    } catch (error) {
      const bodyError = error.message === "body_too_large" || error.message === "invalid_json";
      sendJson(response, bodyError ? 400 : 500, {
        error: {
          code: bodyError ? error.message : "internal_error",
          message: bodyError ? "Não foi possível ler o envio." : "Ocorreu um erro. Tente novamente."
        }
      });
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT ?? 4173);
  const server = createAppServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`Jogo disponível em http://localhost:${port}`);
  });
}