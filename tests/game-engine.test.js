import test from "node:test";
import assert from "node:assert/strict";
import { compareWords, createRound, normalizeWord, publicRound, submitGuess, words } from "../src/game-engine.js";

test("normaliza acentos, caixa e espacos em portugues", () => {
  assert.equal(normalizeWord("  ÁRVORE "), "arvore");
  assert.equal(normalizeWord("Café"), "cafe");
  assert.equal(compareWords("danca", "jardim").band, "cold");
});

test("calcula pontuacao, faixa e rotulo de proximidade", () => {
  assert.deepEqual(compareWords("flor", "jardim"), { score: 67, band: "hot", label: "Quente" });
  assert.deepEqual(compareWords("parque", "jardim"), { score: 45, band: "warm", label: "Morno" });
  assert.deepEqual(compareWords("oceano", "jardim"), { score: 20, band: "cold", label: "Frio" });
  assert.deepEqual(compareWords("JARDIM", "jardim"), { score: 100, band: "exact", label: "Encontrou!" });
});

test("compareWords rejeita palavras fora do vocabulario", () => {
  assert.throws(() => compareWords("abacaxi", "jardim"), /Palavra fora do vocabulário/i);
  assert.throws(() => compareWords("flor", "abacaxi"), /Palavra fora do vocabulário/i);
});

test("cria rodadas com palavra-alvo valida e rejeita alvos invalidos", () => {
  const round = createRound("JÁRDIM");
  assert.equal(round.target, "jardim");
  assert.equal(round.status, "playing");
  assert.deepEqual(round.guesses, []);
  assert.ok(round.id);
  assert.ok(Number.isFinite(Date.parse(round.createdAt)));
  assert.throws(() => createRound("flor"), /Palavra-alvo inválida/i);
  assert.throws(() => createRound("abacaxi"), /Palavra-alvo inválida/i);
});

test("escolhe uma palavra-alvo do vocabulario ao criar rodada aleatoria", () => {
  const round = createRound();
  assert.equal(words.get(round.target).isTarget, true);
});

test("uma rodada revela a resposta apenas depois do acerto", () => {
  const round = createRound("jardim");
  const initialPublicRound = publicRound(round);
  assert.equal("answer" in initialPublicRound, false);

  const firstGuess = submitGuess(round, "flor");
  assert.equal(firstGuess.status, "playing");
  assert.equal(firstGuess.guessCount, 1);
  assert.equal("answer" in publicRound(round), false);

  const winningGuess = submitGuess(round, "JÁRDIM");
  assert.equal(winningGuess.status, "won");
  assert.equal(winningGuess.guessCount, 2);
  assert.equal(publicRound(round).answer, "jardim");
  assert.ok(Number.isFinite(Date.parse(publicRound(round).finishedAt)));
  assert.deepEqual(submitGuess(round, "parque"), { error: "round_finished" });
});

test("palpites invalidos nao alteram a rodada", () => {
  const round = createRound("jardim");
  assert.equal(submitGuess(round, "").error, "invalid_format");
  assert.equal(submitGuess(round, "casa 2").error, "invalid_format");
  assert.equal(submitGuess(round, "casa!").error, "invalid_format");
  assert.equal(submitGuess(round, "abacaxi").error, "unknown_word");
  assert.equal(round.guesses.length, 0);

  assert.equal(submitGuess(round, "flor").status, "playing");
  assert.equal(submitGuess(round, "FLÔR").error, "duplicate_guess");
  assert.equal(round.guesses.length, 1);
});