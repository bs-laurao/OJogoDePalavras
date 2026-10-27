import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createAppServer } from "../server.js";

async function startTestServer(context) {
  const server = createAppServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

async function postGuess(base, roundId, body) {
  return fetch(`${base}/api/rounds/${roundId}/guesses`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body
  });
}

test("API cria rodada, mantem resposta oculta e permite concluir com a palavra correta", async (context) => {
  const base = await startTestServer(context);
  const createdResponse = await fetch(`${base}/api/rounds`, { method: "POST" });
  const created = await createdResponse.json();
  assert.equal(createdResponse.status, 201);
  assert.equal(created.status, "playing");
  assert.equal("answer" in created, false);

  const targetCandidates = ["jardim", "oceano", "livro", "amizade", "cafe", "musica", "viagem", "cachorro"];
  let current = created;
  for (const word of targetCandidates) {
    const response = await postGuess(base, created.id, JSON.stringify({ word }));
    current = await response.json();
    assert.equal(response.status, 200);
    if (current.status === "won") break;
    assert.equal("answer" in current, false);
  }

  assert.equal(current.status, "won");
  assert.ok(targetCandidates.includes(current.answer));
  assert.equal(current.guessCount, current.guesses.length);
});

test("API consulta rodada e responde a identificadores inexistentes e metodos nao permitidos", async (context) => {
  const base = await startTestServer(context);
  const created = await fetch(`${base}/api/rounds`, { method: "POST" }).then((response) => response.json());

  const roundResponse = await fetch(`${base}/api/rounds/${created.id}`);
  assert.equal(roundResponse.status, 200);
  assert.deepEqual(await roundResponse.json(), created);

  const missing = await fetch(`${base}/api/rounds/inexistente`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, "round_not_found");

  const unsupportedMethod = await fetch(`${base}/api/rounds/${created.id}`, { method: "DELETE" });
  assert.equal(unsupportedMethod.status, 405);
  assert.equal((await unsupportedMethod.json()).error.code, "method_not_allowed");
});

test("API entrega o jogo e retorna erro estruturado para palpites invalidos", async (context) => {
  const base = await startTestServer(context);
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /caderno de descobertas/i);

  const created = await fetch(`${base}/api/rounds`, { method: "POST" }).then((response) => response.json());

  const malformedJson = await postGuess(base, created.id, "{");
  assert.equal(malformedJson.status, 400);
  assert.equal((await malformedJson.json()).error.code, "invalid_json");

  const oversizedBody = await postGuess(base, created.id, JSON.stringify({ word: "a".repeat(1025) }));
  assert.equal(oversizedBody.status, 400);
  assert.equal((await oversizedBody.json()).error.code, "body_too_large");

  const tooLong = await postGuess(base, created.id, JSON.stringify({ word: "a".repeat(33) }));
  assert.equal(tooLong.status, 400);
  assert.equal((await tooLong.json()).error.code, "invalid_format");

  const invalidFormat = await postGuess(base, created.id, JSON.stringify({ word: "casa 2" }));
  assert.equal(invalidFormat.status, 400);
  assert.equal((await invalidFormat.json()).error.code, "invalid_format");

  const unknownWord = await postGuess(base, created.id, JSON.stringify({ word: "abacaxi" }));
  assert.equal(unknownWord.status, 422);
  assert.equal((await unknownWord.json()).error.code, "unknown_word");
});

test("API rejeita repeticao, permite vitoria e bloqueia palpites apos o fim", async (context) => {
  const base = await startTestServer(context);
  const created = await fetch(`${base}/api/rounds`, { method: "POST" }).then((response) => response.json());

  const firstGuess = await postGuess(base, created.id, JSON.stringify({ word: "flor" }));
  assert.equal(firstGuess.status, 200);
  assert.equal((await firstGuess.json()).guessCount, 1);

  const duplicateGuess = await postGuess(base, created.id, JSON.stringify({ word: "FLÔR" }));
  assert.equal(duplicateGuess.status, 409);
  assert.equal((await duplicateGuess.json()).error.code, "duplicate_guess");

  const targetCandidates = ["jardim", "oceano", "livro", "amizade", "cafe", "musica", "viagem", "cachorro"];
  let won;
  for (const word of targetCandidates) {
    const response = await postGuess(base, created.id, JSON.stringify({ word }));
    won = await response.json();
    assert.equal(response.status, 200);
    if (won.status === "won") break;
  }
  assert.equal(won.status, "won");

  const finishedGuess = await postGuess(base, created.id, JSON.stringify({ word: "parque" }));
  assert.equal(finishedGuess.status, 409);
  assert.equal((await finishedGuess.json()).error.code, "round_finished");
});
