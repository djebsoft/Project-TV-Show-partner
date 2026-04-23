function formatEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
}

function createEpisodeElement(episode) {
  const card = document.createElement("article");

  const title = document.createElement("h2");
  title.textContent = `${episode.name} - ${formatEpisodeCode(episode.season, episode.number)}`;

  const image = document.createElement("img");
  image.src = episode.image ? episode.image.medium : "";
  image.alt = `Image for ${episode.name}`;

  const summary = document.createElement("div");
  summary.innerHTML = episode.summary || "<p>No summary available.</p>";

  const link = document.createElement("a");
  link.href = episode.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "View episode on TVMaze";

  card.appendChild(title);
  card.appendChild(image);
  card.appendChild(summary);
  card.appendChild(link);

  return card;
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  const heading = document.createElement("h1");
  heading.textContent = `${episodeList.length} Episode(s)`;
  rootElem.appendChild(heading);

  const container = document.createElement("section");
  episodeList.forEach((episode) => {
    container.appendChild(createEpisodeElement(episode));
  });
  rootElem.appendChild(container);

  const credit = document.createElement("p");
  credit.innerHTML =
    'Data originally from <a href="https://tvmaze.com/" target="_blank" rel="noopener noreferrer">TVMaze.com</a>';
  rootElem.appendChild(credit);
}

function setup() {
  const allEpisodes = getAllEpisodes();
  makePageForEpisodes(allEpisodes);
}

window.onload = setup;
