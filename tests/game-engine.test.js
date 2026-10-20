import test from "node:test";
import assert from "node:assert/strict";
import { compareWords, createRound, normalizeWord, publicRound, submitGuess } from "../src/game-engine.js";

test("normaliza acentos, caixa e espacos em portugues", () => {
  assert.equal(normalizeWord("  ÁRVORE "), "arvore");
  assert.equal(normalizeWord("Café"), "cafe");
  assert.equal(compareWords("danca", "jardim").band, "cold");
});

test("calcula uma faixa semantica e reconhece a palavra exata", () => {
  assert.equal(compareWords("flor", "jardim").band, "hot");
  assert.equal(compareWords("oceano", "jardim").band, "cold");
  assert.equal(compareWords("JARDIM", "jardim").band, "exact");
});

test("uma rodada revela a resposta apenas depois do acerto", () => {
  const round = createRound("jardim");
  assert.equal(publicRound(round).answer, undefined);
  assert.equal(submitGuess(round, "flor").status, "playing");
  assert.equal(submitGuess(round, "JÁRDIM").status, "won");
  assert.equal(publicRound(round).answer, "jardim");
  assert.equal(submitGuess(round, "parque").error, "round_finished");
});

test("rejeita formato invalido, palavras desconhecidas e repeticoes", () => {
  const round = createRound("jardim");
  assert.equal(submitGuess(round, "casa 2").error, "invalid_format");
  assert.equal(submitGuess(round, "abacaxi").error, "unknown_word");
  assert.equal(submitGuess(round, "flor").status, "playing");
  assert.equal(submitGuess(round, "FLÔR").error, "duplicate_guess");
});