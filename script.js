const SHOWS_URL = "https://api.tvmaze.com/shows";
/*let episodesPromise = null;*/ //TO DELETE
const showsCache = { data: null };
const episodesCache = {};

function hideLoading() {
  document.getElementById("loading-message").classList.add("hidden");
}

function showError(message) {
  hideLoading();
  const errorElem = document.getElementById("error-message");
  errorElem.classList.remove("hidden");
  errorElem.textContent = `Error loading episodes: ${message}`;
}

function clearError() {
  const errorElem = document.getElementById("error-message");
  errorElem.classList.add("hidden");
  errorElem.textContent = "";
}

function fetchShowsOnce() {
  if (showsCache.data) return Promise.resolve(showsCache.data);

  return fetch(SHOWS_URL)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch shows");
      return res.json();
    })
    .then((shows) => {
      // Sort alphabetically (case-insensitive)
      const sortedShows = shows.sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
      );
      showsCache.data = sortedShows;
      return sortedShows;
    });
}

function fetchEpisodesOnce(showId) {
  if (episodesCache[showId]) return Promise.resolve(episodesCache[showId]);

  return fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch episodes");
      return res.json();
    })
    .then((episodes) => {
      episodesCache[showId] = episodes;
      return episodes;
    });
}

function createEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
}

function stripHtml(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html || "";
  return temp.textContent || temp.innerText || "";
}

function createSearchText(episode) {
  return `${episode.name} ${stripHtml(episode.summary || "")}`.toLowerCase();
}

function createEpisodeCard(episode) {
  const template = document.getElementById("episode-card-template");
  const card = template.content.firstElementChild.cloneNode(true);

  const episodeCode = createEpisodeCode(episode.season, episode.number);
  const imageSrc = episode.image ? episode.image.medium : "";

  card.querySelector(".episode-code").textContent = episodeCode;
  card.querySelector(".episode-numbers").textContent =
    `Season ${episode.season} - Episode ${episode.number}`;

  const imageElem = card.querySelector(".episode-image-img");
  const imageContainer = card.querySelector(".episode-image");
  if (imageSrc) {
    imageElem.src = imageSrc;
    imageElem.alt = episode.name;
  } else {
    imageContainer.classList.add("hidden");
  }

  card.querySelector(".episode-title").textContent = episode.name;
  const summaryText = stripHtml(episode.summary || "");
  card.querySelector(".episode-summary").textContent =
    summaryText || "No summary available.";
  card.querySelector(".episode-url").href = episode.url;

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

function populateEpisodeSelect(episodes) {
  const select = document.getElementById("episode-select");
  select.replaceChildren();

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All episodes";
  select.appendChild(allOption);

  episodes.forEach((episode) => {
    const option = document.createElement("option");
    option.value = String(episode.id);
    option.textContent = `${createEpisodeCode(episode.season, episode.number)} - ${episode.name}`;
    select.appendChild(option);
  });
}

function populateShowSelect(shows) {
  const select = document.getElementById("show-select");
  select.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a show...";
  select.appendChild(defaultOption);

  shows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    select.appendChild(option);
  });
}

function setup() {
  const showSelect = document.getElementById("show-select");
  const episodeSelect = document.getElementById("episode-select");
  const filterInput = document.getElementById("filter-input");

  let currentEpisodes = [];

  // Helper to fetch and render episodes for a specific ID
  function loadShowById(showId) {
    if (!showId) return;

    console.log(`Fetching episodes for show ID: ${showId}`);
    document.getElementById("loading-message").classList.remove("hidden");

    fetchEpisodesOnce(showId)
      .then((episodes) => {
        hideLoading();
        clearError();

        currentEpisodes = episodes.map((ep) => ({
          ...ep,
          _searchText:
            `${ep.name} ${stripHtml(ep.summary || "")}`.toLowerCase(),
        }));

        populateEpisodeSelect(currentEpisodes);
        filterInput.value = "";
        renderEpisodes(currentEpisodes, currentEpisodes.length);
        console.log("Episodes rendered successfully.");
      })
      .catch((err) => {
        console.error("Error loading episodes:", err);
        showError(err.message);
      });
  }

  // 1. Load the shows list
  console.log("Fetching shows list...");
  fetchShowsOnce()
    .then((shows) => {
      console.log(`Loaded ${shows.length} shows.`);
      populateShowSelect(shows);
      hideLoading();

      // 2. Default to "2 Broke Girls" (ID: 1338)
      const defaultShowId = "1338";

      // We set the value in the dropdown
      showSelect.value = defaultShowId;

      // 3. Force the load immediately
      loadShowById(defaultShowId);
    })
    .catch((err) => {
      console.error("Error loading shows:", err);
      showError(err.message);
    });

  // Listeners
  showSelect.addEventListener("change", (e) => loadShowById(e.target.value));

  function applyFilters() {
    const searchTerm = filterInput.value.toLowerCase();
    const selectedEpId = episodeSelect.value;

    const filtered = currentEpisodes.filter((ep) => {
      const matchesSearch = ep._searchText.includes(searchTerm);
      const matchesSelection = !selectedEpId || String(ep.id) === selectedEpId;
      return matchesSearch && matchesSelection;
    });

    renderEpisodes(filtered, currentEpisodes.length);
  }

  filterInput.addEventListener("input", applyFilters);
  episodeSelect.addEventListener("change", applyFilters);
}

window.onload = setup;
