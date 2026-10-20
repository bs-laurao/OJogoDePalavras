import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createAppServer } from "../server.js";

test("API cria uma rodada, mantém a resposta oculta e conclui com o palpite correto", async (context) => {
  const server = createAppServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const createdResponse = await fetch(`${base}/api/rounds`, { method: "POST" });
  const created = await createdResponse.json();
  assert.equal(createdResponse.status, 201);
  assert.equal(created.status, "playing");
  assert.equal("answer" in created, false);

  const targetCandidates = ["jardim", "oceano", "livro", "amizade", "cafe", "musica", "viagem", "cachorro"];
  let current = created;
  for (const word of targetCandidates) {
    const response = await fetch(`${base}/api/rounds/${created.id}/guesses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ word })
    });
    current = await response.json();
    assert.equal(response.status, 200);
    if (current.status === "won") break;
    assert.equal("answer" in current, false);
  }
  assert.equal(current.status, "won");
  assert.ok(targetCandidates.includes(current.answer));
});

test("servidor entrega o jogo e rejeita palpites desconhecidos com erro legivel", async (context) => {
  const server = createAppServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /caderno de descobertas/i);

  const created = await fetch(`${base}/api/rounds`, { method: "POST" }).then((response) => response.json());
  const invalid = await fetch(`${base}/api/rounds/${created.id}/guesses`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ word: "abacaxi" })
  });
  assert.equal(invalid.status, 422);
  assert.equal((await invalid.json()).error.code, "unknown_word");
});