const list = document.querySelector("#movie-list");
const status = document.querySelector("#status");
const summary = document.querySelector("#summary");
const search = document.querySelector("#search");
const genre = document.querySelector("#genre");
let allMovies = [];

function setStatus(message, kind = "info") {
  status.textContent = message;
  status.dataset.kind = kind;
}

function normalizeMovie(raw) {
  const item = raw && typeof raw === "object" ? raw : {};

  return {
    title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Без названия",
    genre: typeof item.genre === "string" && item.genre.trim() ? item.genre.trim() : "Жанр не указан",
    year: Number.isFinite(Number(item.year)) && Number(item.year) > 0 ? Number(item.year) : "—",
    rating: Number.isFinite(Number(item.rating)) ? Number(item.rating).toFixed(1) : "—",
    duration: Number.isFinite(Number(item.duration)) && Number(item.duration) > 0 ? Number(item.duration) : 0,
    sessions: Array.isArray(item.sessions) ? item.sessions.map((s) => String(s)) : [],
    tags: Array.isArray(item.tags) ? item.tags.map((t) => String(t)) : [],
  };
}

function renderMovies(movies) {
  list.replaceChildren();

  if (!Array.isArray(movies) || movies.length === 0) {
    const emptyBlock = document.createElement("div");
    emptyBlock.className = "empty";
    emptyBlock.textContent = "Фильмы по заданным условиям не найдены.";
    list.appendChild(emptyBlock);
    return;
  }

  movies.forEach((movie) => {
    const card = document.createElement("article");
    card.className = "movie-card";

    const titleEl = document.createElement("h3");
    titleEl.textContent = movie.title;

    const metaEl = document.createElement("p");
    const durationText = movie.duration > 0 ? `${movie.duration} мин.` : "длительность не указана";
    metaEl.textContent = `${movie.genre} • ${movie.year} • Рейтинг: ${movie.rating} • ${durationText}`;

    const sessionsEl = document.createElement("p");
    if (movie.sessions.length > 0) {
      sessionsEl.textContent = `Сеансы: ${movie.sessions.join(", ")}`;
    } else {
      sessionsEl.textContent = "Сеансы пока не назначены";
    }

    const tagsEl = document.createElement("p");
    tagsEl.className = "movie-tags";
    tagsEl.textContent = movie.tags.length > 0 ? `Теги: ${movie.tags.join(", ")}` : "Теги отсутствуют";

    card.append(titleEl, metaEl, sessionsEl, tagsEl);
    list.appendChild(card);
  });
}

function applyFilters() {
  const query = search.value.trim().toLowerCase();
  const selectedGenre = genre.value.trim().toLowerCase();

  const filtered = allMovies.filter((movie) => {
    const matchesTitle = movie.title.toLowerCase().includes(query);
    const matchesGenre = !selectedGenre || selectedGenre === "all" || movie.genre.toLowerCase() === selectedGenre;
    return matchesTitle && matchesGenre;
  });

  summary.textContent = `Показано: ${filtered.length} из ${allMovies.length}`;
  renderMovies(filtered);
}

async function fetchMovies(empty = false) {
  const url = empty ? "/api/movies?empty=1" : "/api/movies";
  setStatus("Загрузка каталога фильмов...", "info");

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Ошибка сервера (${response.status})`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.movies)) {
      throw new Error("Некорректный формат ответа: отсутствует массив movies");
    }

    allMovies = data.movies.map(normalizeMovie);
    applyFilters();
    setStatus(`Загружено фильмов: ${allMovies.length}`, "success");
  } catch (error) {
    allMovies = [];
    applyFilters();
    setStatus(`Ошибка загрузки: ${error.message}`, "error");
  }
}

document
  .querySelector("#load-button")
  .addEventListener("click", () => fetchMovies());

document
  .querySelector("#clear-button")
  .addEventListener("click", () => fetchMovies(true));

search.addEventListener("input", applyFilters);
genre.addEventListener("change", applyFilters);

fetchMovies();