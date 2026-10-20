const form = document.querySelector("#guess-form");
const input = document.querySelector("#guess-input");
const submitButton = document.querySelector("#guess-submit");
const newRoundButton = document.querySelector("#new-round");
const gameFrame = document.querySelector("#game-frame");
const roundStatus = document.querySelector("#round-status");
const history = document.querySelector("#guess-list");
const count = document.querySelector("#guess-count");
const emptyHistory = document.querySelector("#empty-history");
const formMessage = document.querySelector("#form-message");
const proximityLabel = document.querySelector("#proximity-label");
const proximityWord = document.querySelector("#proximity-word");
const proximityTrack = document.querySelector("#proximity-track");
const trackMarker = document.querySelector("#track-marker");
const elapsed = document.querySelector("#elapsed");
const resultPanel = document.querySelector("#round-result");
const answer = document.querySelector("#answer");
const resultSummary = document.querySelector("#result-summary");
const announcement = document.querySelector("#announcement");

let round;
let timer;
let submitting = false;

class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: { "content-type": "application/json", ...options.headers }
    });
  } catch {
    throw new ApiError("network_error", "Sem conexão com a rodada. Verifique a rede e tente novamente.");
  }

  const payload = await response.json();
  if (!response.ok) throw new ApiError(payload.error?.code ?? "request_failed", payload.error?.message ?? "Não foi possível concluir a ação.");
  return payload;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function showMessage(text, kind = "") {
  formMessage.textContent = text;
  formMessage.dataset.kind = kind;
}

function renderHistory() {
  history.replaceChildren();
  const guesses = [...(round?.guesses ?? [])].reverse();

  guesses.forEach((guess, index) => {
    const row = document.createElement("li");
    row.className = "guess-row";

    const number = document.createElement("span");
    number.className = "guess-index";
    number.textContent = String(round.guessCount - index).padStart(2, "0");

    const word = document.createElement("span");
    word.className = "guess-word";
    word.textContent = guess.word;

    const band = document.createElement("span");
    band.className = "guess-band";
    band.dataset.band = guess.band;
    band.textContent = guess.label;

    row.append(number, word, band);
    history.append(row);
  });

  count.textContent = String(round?.guessCount ?? 0);
  emptyHistory.hidden = guesses.length > 0;
  history.hidden = guesses.length === 0;
}

function renderFeedback() {
  const latest = round?.guesses.at(-1);
  if (!latest) {
    proximityLabel.textContent = "Aguardando palpite";
    proximityWord.textContent = "Sua primeira ideia começa a trilha.";
    proximityTrack.setAttribute("aria-label", "Nenhum palpite enviado ainda");
    trackMarker.style.left = "2%";
    return;
  }

  const label = latest.band === "exact" ? "Encontrou!" : latest.label;
  const position = Math.max(2, Math.min(98, latest.score));
  proximityLabel.textContent = label;
  proximityWord.textContent = latest.band === "exact"
    ? `${latest.word} era a palavra escondida.`
    : `${latest.word} está ${label.toLocaleLowerCase("pt-BR")}. Continue explorando.`;
  proximityTrack.setAttribute("aria-label", `Proximidade ${label.toLocaleLowerCase("pt-BR")} para ${latest.word}`);
  trackMarker.style.left = `${position}%`;
}

function renderRound() {
  const isPlaying = round?.status === "playing";
  const isWon = round?.status === "won";
  gameFrame.dataset.state = isWon ? "won" : isPlaying ? "playing" : "loading";
  roundStatus.textContent = isWon ? "Palavra encontrada" : isPlaying ? "Rodada em andamento" : "Preparando sua rodada";
  input.disabled = !isPlaying || submitting;
  submitButton.disabled = !isPlaying || submitting;
  newRoundButton.disabled = submitting || !round;
  renderHistory();
  renderFeedback();

  resultPanel.hidden = !isWon;
  if (isWon) {
    answer.textContent = round.answer;
    resultSummary.textContent = `Encontrada em ${round.guessCount} ${round.guessCount === 1 ? "palpite" : "palpites"} e ${elapsed.textContent}.`;
    announcement.textContent = `Palavra encontrada: ${round.answer}, em ${round.guessCount} palpites.`;
  }
}

function updateTimer() {
  if (!round || round.status !== "playing") return;
  elapsed.textContent = formatTime(getElapsedSeconds(round));
}

function getElapsedSeconds(currentRound) {
  const endTime = currentRound.status === "won" && currentRound.finishedAt
    ? Date.parse(currentRound.finishedAt)
    : Date.now();
  return Math.max(0, Math.floor((endTime - Date.parse(currentRound.createdAt)) / 1000));
}

async function beginRound({ restore = true } = {}) {
  clearInterval(timer);
  newRoundButton.disabled = true;
  showMessage("");
  roundStatus.textContent = "Preparando sua rodada";
  gameFrame.dataset.state = "loading";

  try {
    const savedId = restore ? sessionStorage.getItem("word-game-round") : null;
    round = savedId ? await request(`/api/rounds/${encodeURIComponent(savedId)}`) : null;
    if (!round) round = await request("/api/rounds", { method: "POST", body: "{}" });
    sessionStorage.setItem("word-game-round", round.id);
    elapsed.textContent = formatTime(getElapsedSeconds(round));
    renderRound();
    if (round.status === "playing") {
      timer = setInterval(updateTimer, 1000);
      input.focus();
    }
  } catch (error) {
    round = null;
    renderRound();
    roundStatus.textContent = "Não foi possível iniciar";
    showMessage(error.message, "error");
    newRoundButton.disabled = false;
    newRoundButton.textContent = "Tentar novamente";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!round || round.status !== "playing" || submitting) return;

  const word = input.value.trim();
  if (!word) {
    showMessage("Escreva uma palavra para continuar.", "error");
    input.focus();
    return;
  }

  submitting = true;
  newRoundButton.disabled = true;
  submitButton.disabled = true;
  showMessage("Verificando seu palpite…");

  try {
    round = await request(`/api/rounds/${encodeURIComponent(round.id)}/guesses`, {
      method: "POST",
      body: JSON.stringify({ word })
    });
    input.value = "";
    elapsed.textContent = formatTime(getElapsedSeconds(round));
    showMessage(round.status === "won" ? "Palavra encontrada." : `${round.guesses.at(-1).word}: ${round.guesses.at(-1).label}.`, "success");
    announcement.textContent = round.status === "won"
      ? `Palavra encontrada em ${round.guessCount} palpites.`
      : `Palpite ${round.guesses.at(-1).word}: ${round.guesses.at(-1).label}.`;
    renderRound();
    if (round.status === "won") clearInterval(timer);
    else input.focus();
  } catch (error) {
    showMessage(error.message, "error");
    input.select();
  } finally {
    submitting = false;
    renderRound();
  }
});

newRoundButton.addEventListener("click", () => {
  sessionStorage.removeItem("word-game-round");
  newRoundButton.innerHTML = '<span aria-hidden="true">↻</span> Nova rodada';
  beginRound({ restore: false });
});

beginRound();