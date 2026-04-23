const SHOWS_URL = "https://api.tvmaze.com/shows";
const fetchCache = new Map();

const state = {
  allShows: [],
  selectedShowId: "",
  allEpisodes: [],
};

function hideLoading() {
  document.getElementById("loading-message").classList.add("hidden");
}

function showLoading(message) {
  const loadingElem = document.getElementById("loading-message");
  loadingElem.classList.remove("hidden");
  loadingElem.textContent = message;
}

function showError(message) {
  hideLoading();
  const errorElem = document.getElementById("error-message");
  errorElem.classList.remove("hidden");
  errorElem.textContent = `Error loading data: ${message}`;
}

function clearError() {
  const errorElem = document.getElementById("error-message");
  errorElem.classList.add("hidden");
  errorElem.textContent = "";
}

function updateCacheDebug() {
  const cacheList = document.getElementById("cache-urls");
  if (!cacheList) {
    return;
  }

  const cachedUrls = [...fetchCache.keys()];
  if (cachedUrls.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "None yet";
    cacheList.replaceChildren(emptyItem);
    return;
  }

  const items = cachedUrls.map((url) => {
    const item = document.createElement("li");
    item.textContent = url;
    return item;
  });

  cacheList.replaceChildren(...items);
}

function fetchJsonOnce(url) {
  if (fetchCache.has(url)) {
    updateCacheDebug();
    return fetchCache.get(url);
  }

  const requestPromise = fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  });

  fetchCache.set(url, requestPromise);
  updateCacheDebug();
  return requestPromise;
}

function createEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
}

function createEpisodeCard(episode) {
  const card = document.createElement("article");
  card.className = "episode-card";

  const episodeCode = createEpisodeCode(episode.season, episode.number);
  const imageSrc = episode.image ? episode.image.medium : "";

  card.innerHTML = `
    <div class="episode-header">
      <h2>${episodeCode}</h2>
      <p class="episode-numbers">Season ${episode.season} - Episode ${episode.number}</p>
    </div>
    <div class="episode-image">
      <img src="${imageSrc}" alt="${episode.name}">
    </div>
    <div class="episode-name">
      <h3>${episode.name}</h3>
    </div>
    <div class="episode-summary">
      ${episode.summary || "<p>No summary available.</p>"}
    </div>
    <div class="episode-link">
      <a href="${episode.url}" target="_blank" rel="noopener noreferrer">View on TVMaze</a>
    </div>
  `;

  return card;
}

function renderEpisodes(episodeList, totalCount) {
  const totalElem = document.getElementById("episode-total");
  const countElem = document.getElementById("episode-count");
  const episodesElem = document.getElementById("episodes");

  totalElem.textContent = `${totalCount} Episode(s)`;
  countElem.textContent = `Displaying ${episodeList.length}/${totalCount} episode(s)`;
  episodesElem.replaceChildren(...episodeList.map(createEpisodeCard));
}

function populateShowSelect(shows) {
  const showSelect = document.getElementById("show-select");
  showSelect.replaceChildren();

  const sortedShows = [...shows].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  sortedShows.forEach((show) => {
    const option = document.createElement("option");
    option.value = String(show.id);
    option.textContent = show.name;
    showSelect.appendChild(option);
  });

  if (sortedShows.length > 0) {
    state.selectedShowId = String(sortedShows[0].id);
    showSelect.value = state.selectedShowId;
  }
}

function populateEpisodeSelect(episodes) {
  const episodeSelect = document.getElementById("episode-select");
  episodeSelect.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All episodes";
  episodeSelect.appendChild(allOption);

  episodes.forEach((episode) => {
    const option = document.createElement("option");
    option.value = String(episode.id);
    option.textContent = `${createEpisodeCode(episode.season, episode.number)} - ${episode.name}`;
    episodeSelect.appendChild(option);
  });

  episodeSelect.value = "";
}

function applyFilters() {
  const filterInput = document.getElementById("filter-input");
  const episodeSelect = document.getElementById("episode-select");

  const searchTerm = filterInput.value.trim().toLowerCase();
  const selectedEpisodeId = episodeSelect.value;

  const filtered = state.allEpisodes.filter((episode) => {
    const matchesSearch =
      episode.name.toLowerCase().includes(searchTerm) ||
      (episode.summary || "").toLowerCase().includes(searchTerm);
    const matchesEpisode =
      !selectedEpisodeId || String(episode.id) === selectedEpisodeId;

    return matchesSearch && matchesEpisode;
  });

  renderEpisodes(filtered, state.allEpisodes.length);
}

function getEpisodesUrl(showId) {
  return `https://api.tvmaze.com/shows/${showId}/episodes`;
}

function loadEpisodesForShow(showId) {
  showLoading("Loading episodes...");
  clearError();

  return fetchJsonOnce(getEpisodesUrl(showId))
    .then((episodes) => {
      hideLoading();
      state.allEpisodes = Array.isArray(episodes) ? episodes : [];
      populateEpisodeSelect(state.allEpisodes);
      applyFilters();
    })
    .catch((error) => {
      state.allEpisodes = [];
      populateEpisodeSelect([]);
      renderEpisodes([], 0);
      showError(error.message);
    });
}

function setupEventListeners() {
  const showSelect = document.getElementById("show-select");
  const episodeSelect = document.getElementById("episode-select");
  const filterInput = document.getElementById("filter-input");

  showSelect.addEventListener("change", () => {
    state.selectedShowId = showSelect.value;
    filterInput.value = "";
    loadEpisodesForShow(state.selectedShowId);
  });

  episodeSelect.addEventListener("change", applyFilters);
  filterInput.addEventListener("input", applyFilters);
}

function setup() {
  showLoading("Loading shows...");
  clearError();
  updateCacheDebug();
  setupEventListeners();

  fetchJsonOnce(SHOWS_URL)
    .then((shows) => {
      if (!Array.isArray(shows) || shows.length === 0) {
        throw new Error("No shows found");
      }

      state.allShows = shows;
      populateShowSelect(shows);
      return loadEpisodesForShow(state.selectedShowId);
    })
    .catch((error) => {
      showError(error.message);
    });
}

window.onload = setup;
