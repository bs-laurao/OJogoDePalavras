import { randomUUID } from "node:crypto";

const wordEntries = [
  ["jardim", ["natureza", "plantas", "flores", "exterior", "cultivo"], true],
  ["flor", ["natureza", "plantas", "flores", "beleza"]],
  ["rosa", ["natureza", "plantas", "flores", "beleza", "cores"]],
  ["folha", ["natureza", "plantas", "arvores", "verde"]],
  ["planta", ["natureza", "plantas", "cultivo", "crescimento"]],
  ["arvore", ["natureza", "plantas", "arvores", "exterior"]],
  ["bosque", ["natureza", "arvores", "exterior", "lugar"]],
  ["floresta", ["natureza", "plantas", "arvores", "exterior", "lugar"]],
  ["horta", ["natureza", "plantas", "cultivo", "comida", "exterior"]],
  ["vaso", ["plantas", "cultivo", "casa", "objeto"]],
  ["terra", ["natureza", "cultivo", "solo", "planeta"]],
  ["solo", ["natureza", "cultivo", "terra"]],
  ["grama", ["natureza", "plantas", "exterior", "verde"]],
  ["parque", ["natureza", "exterior", "lugar", "lazer"]],
  ["praca", ["natureza", "exterior", "lugar", "cidade"]],
  ["regador", ["plantas", "cultivo", "agua", "objeto"]],
  ["agua", ["natureza", "liquido", "vida"]],
  ["oceano", ["natureza", "agua", "lugar", "azul", "profundidade"], true],
  ["mar", ["natureza", "agua", "lugar", "azul"]],
  ["praia", ["natureza", "agua", "lugar", "lazer", "exterior"]],
  ["rio", ["natureza", "agua", "lugar", "movimento"]],
  ["onda", ["natureza", "agua", "movimento"]],
  ["peixe", ["natureza", "agua", "animal", "vida"]],
  ["livro", ["leitura", "conhecimento", "objeto", "papel", "historia"], true],
  ["leitura", ["leitura", "conhecimento", "atividade"]],
  ["escola", ["conhecimento", "aprendizado", "lugar", "pessoas"]],
  ["historia", ["leitura", "conhecimento", "narrativa", "tempo"]],
  ["papel", ["leitura", "objeto", "material", "escrita"]],
  ["escrever", ["escrita", "atividade", "conhecimento"]],
  ["amizade", ["relacao", "emocao", "social", "confianca", "pessoas"], true],
  ["amigo", ["relacao", "emocao", "social", "confianca", "pessoas"]],
  ["familia", ["relacao", "social", "casa", "pessoas", "confianca"]],
  ["carinho", ["relacao", "emocao", "afeto"]],
  ["conversa", ["relacao", "social", "comunicacao", "pessoas"]],
  ["cafe", ["bebida", "comida", "aroma", "rotina", "calor"], true],
  ["cha", ["bebida", "comida", "aroma", "calor"]],
  ["leite", ["bebida", "comida", "casa"]],
  ["cozinha", ["comida", "casa", "lugar"]],
  ["xicara", ["bebida", "objeto", "casa"]],
  ["aroma", ["bebida", "comida", "sentido"]],
  ["manha", ["rotina", "tempo", "dia"]],
  ["pao", ["comida", "rotina", "casa"]],
  ["bolo", ["comida", "casa", "doce"]],
  ["musica", ["som", "arte", "emocao", "ritmo", "performance"], true],
  ["cancao", ["som", "arte", "emocao", "ritmo", "voz"]],
  ["som", ["som", "sentido"]],
  ["violao", ["som", "arte", "ritmo", "objeto"]],
  ["dança", ["arte", "ritmo", "performance", "movimento"]],
  ["viagem", ["movimento", "lugar", "descoberta", "cultura", "tempo"], true],
  ["mapa", ["movimento", "lugar", "descoberta", "objeto"]],
  ["estrada", ["movimento", "lugar", "viagem"]],
  ["mala", ["viagem", "objeto", "movimento"]],
  ["aviao", ["movimento", "viagem", "transporte", "lugar"]],
  ["cachorro", ["animal", "pet", "companhia", "casa", "natureza"], true],
  ["cao", ["animal", "pet", "companhia", "casa"]],
  ["gato", ["animal", "pet", "companhia", "casa"]],
  ["animal", ["animal", "natureza", "vida"]],
  ["passeio", ["animal", "pet", "movimento", "exterior"]],
  ["bola", ["objeto", "lazer", "movimento"]],
  ["casa", ["casa", "lugar", "pessoas"]],
  ["cidade", ["lugar", "pessoas", "cultura"]],
  ["pedra", ["natureza", "material", "objeto"]],
  ["sol", ["natureza", "dia", "calor", "luz"]],
  ["lua", ["natureza", "noite", "luz", "espaco"]],
  ["estrela", ["natureza", "noite", "luz", "espaco"]]
];

export const words = new Map(
  wordEntries.map(([word, features, isTarget]) => [normalizeWord(word), { word, features, isTarget: Boolean(isTarget) }])
);

export function normalizeWord(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

export function createRound(targetWord) {
  const targets = [...words.values()].filter((entry) => entry.isTarget);
  const target = targetWord ? words.get(normalizeWord(targetWord)) : targets[Math.floor(Math.random() * targets.length)];

  if (!target?.isTarget) throw new Error("Palavra-alvo inválida.");

  return {
    id: randomUUID(),
    target: target.word,
    status: "playing",
    guesses: [],
    createdAt: new Date().toISOString()
  };
}

export function compareWords(guessWord, targetWord) {
  const guess = words.get(normalizeWord(guessWord));
  const target = words.get(normalizeWord(targetWord));

  if (!guess || !target) throw new Error("Palavra fora do vocabulário disponível.");
  if (guess.word === target.word) return { score: 100, band: "exact", label: "Encontrou!" };

  const shared = guess.features.filter((feature) => target.features.includes(feature)).length;
  const score = Math.round((shared / Math.sqrt(guess.features.length * target.features.length)) * 100);
  const band = score >= 55 ? "hot" : score >= 25 ? "warm" : "cold";
  const label = band === "hot" ? "Quente" : band === "warm" ? "Morno" : "Frio";

  return { score, band, label };
}

export function submitGuess(round, value) {
  if (round.status !== "playing") return { error: "round_finished" };

  const normalized = normalizeWord(value);
  if (!normalized || !/^[\p{L}]+$/u.test(normalized)) return { error: "invalid_format" };
  if (!words.has(normalized)) return { error: "unknown_word" };
  if (round.guesses.some((guess) => guess.normalized === normalized)) return { error: "duplicate_guess" };

  const comparison = compareWords(normalized, round.target);
  const guess = { normalized, word: words.get(normalized).word, ...comparison };
  round.guesses.push(guess);

  if (comparison.band === "exact") {
    round.status = "won";
    round.finishedAt = new Date().toISOString();
  }

  return { guess, status: round.status, guessCount: round.guesses.length };
}

export function publicRound(round) {
  return {
    id: round.id,
    status: round.status,
    guesses: round.guesses.map(({ word, band, label, score }) => ({ word, band, label, score })),
    guessCount: round.guesses.length,
    createdAt: round.createdAt,
    ...(round.status === "won" ? { answer: words.get(round.target).word, finishedAt: round.finishedAt } : {})
  };
}