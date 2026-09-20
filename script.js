const contentFiles = {
  shortBio: "./docs/bio-short.md",
  longBio: "./docs/bio-long.md",
  links: "./docs/links.json",
  releases: "./docs/releases.json"
};

const getText = (path) => fetch(path).then((response) => {
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.text();
});

const getJson = (path) => getText(path).then(JSON.parse);

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const markdownSections = (markdown) => {
  const sections = [];
  let current = { heading: "", paragraphs: [] };

  markdown.split(/\r?\n/).forEach((line) => {
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      if (current.heading || current.paragraphs.length) sections.push(current);
      current = { heading: heading[1], paragraphs: [] };
    } else if (line.trim()) {
      current.paragraphs.push(line.trim());
    }
  });

  if (current.heading || current.paragraphs.length) sections.push(current);
  return sections;
};

const fillParagraphs = (element, markdown, excludeWorldContext = false, omitOpeningParagraph = false) => {
  const hiddenOnHome = /conceptual project|narrative universe|The story never/i;
  const paragraphs = markdownSections(markdown).flatMap((section) => section.paragraphs)
    .filter((paragraph) => !/\bBPM\b/i.test(String(paragraph)))
    .filter((paragraph) => !excludeWorldContext || !hiddenOnHome.test(String(paragraph)));
  (omitOpeningParagraph ? paragraphs.slice(1) : paragraphs)
    .forEach((paragraph) => element.append(createElement("p", "", paragraph)));
};

const localAsset = (path) => `.${path}`;

const makePlayButton = (title, url, id, label = "Play", iconOnly = true) => {
  const button = createElement("button", "play-button", iconOnly ? "▶" : label);
  button.type = "button";
  setPlaybackTarget(button, title, url, id, label);
  button.dataset.iconOnly = String(iconOnly);
  return button;
};

const setPlaybackTarget = (element, title, url, id, label = "Play") => {
  element.dataset.playUrl = url;
  element.dataset.trackId = id;
  element.dataset.trackTitle = title;
  element.dataset.defaultLabel = label;
  element.setAttribute("aria-label", `${label} ${title}`);
};

const playbackTitle = (className, title, url, id) => {
  const button = createElement("button", className, title);
  button.type = "button";
  setPlaybackTarget(button, title, url, id);
  return button;
};

const releaseTitle = (title, url, id) => {
  const heading = createElement("h3", "release-title");
  heading.append(playbackTitle("release-title-button", title, url, id));
  return heading;
};

const archiveReleaseTitle = (title, url, id) => {
  const heading = createElement("h3", "release-title");
  const button = playbackTitle("release-title-button", title, url, id);
  const match = title.match(/^(.*?)(\s*\([^()]+\))$/);

  if (match) {
    button.textContent = "";
    button.append(
      createElement("span", "release-title-main", match[1].trim()),
      createElement("span", "release-title-detail", match[2].trim())
    );
  }

  heading.append(button);
  return heading;
};

const releaseArtwork = (release, className, playback) => {
  const artwork = createElement("button", `${className} playable-artwork`);
  artwork.type = "button";
  setPlaybackTarget(artwork, playback.title, playback.url, playback.id);
  const image = document.createElement("img");
  image.src = localAsset(release.artwork);
  image.alt = `${release.title} artwork`;
  image.loading = "lazy";
  artwork.append(image);
  return artwork;
};

const renderFeaturedRelease = (release) => {
  const target = document.querySelector("[data-featured-release]");
  const card = createElement("article", "featured-release-card");
  const body = createElement("div", "release-body");
  const fullEp = { id: `${release.id}-full`, title: release.title, url: release.soundcloud };
  body.append(createElement("p", "release-label", "EP"));
  body.append(releaseTitle(release.title, fullEp.url, fullEp.id));

  const tracks = createElement("ol", "track-list");
  release.tracks.forEach((track) => {
    const item = document.createElement("li");
    item.append(
      createElement("span", "track-number", String(track["track_number"]).padStart(2, "0")),
      playbackTitle("track-title track-title-button", track.title, track.soundcloud, `${release.id}-${track["track_number"]}`),
      makePlayButton(track.title, track.soundcloud, `${release.id}-${track["track_number"]}`)
    );
    tracks.append(item);
  });
  body.append(tracks);

  const fullEpButton = makePlayButton(fullEp.title, fullEp.url, fullEp.id, "Play full EP", false);
  fullEpButton.classList.add("ep-play");
  body.append(fullEpButton);
  card.append(releaseArtwork(release, "featured-release-art", fullEp), body);
  target.append(card);
};

const renderArchiveReleases = (releases) => {
  const target = document.querySelector("[data-archive-grid]");
  releases.forEach((release) => {
    const track = release.tracks[0];
    const playback = { id: `${release.id}-${track["track_number"]}`, title: track.title, url: track.soundcloud };
    const card = createElement("article", "archive-release");
    const body = createElement("div", "release-body");
    body.append(
      createElement("p", "release-label", "Single"),
      archiveReleaseTitle(release.title, playback.url, playback.id),
      makePlayButton(playback.title, playback.url, playback.id)
    );
    card.append(releaseArtwork(release, "archive-release-art", playback), body);
    target.append(card);
  });
};

const renderReleases = (releases) => {
  const featured = releases.find((release) => release.type === "ep");
  if (featured) renderFeaturedRelease(featured);
  renderArchiveReleases(releases.filter((release) => release.type === "single"));
};

const renderLinks = (links) => {
  const target = document.querySelector("[data-links]");
  const services = ["instagram", "soundcloud", "spotify", "youtube", "mavelpoint"];
  const labels = { instagram: "Instagram", soundcloud: "SoundCloud", spotify: "Spotify", youtube: "YouTube", mavelpoint: "MavelPoint" };
  const entries = services.filter((key) => links[key]).map((key) => ({
    label: labels[key],
    href: /^https?:\/\//.test(links[key]) ? links[key] : `https://${links[key]}`,
    external: true
  }));

  ["booking_email", "collective_email"].forEach((key) => {
    if (links[key]) entries.push({ label: key === "booking_email" ? "Booking" : "Collective", href: `mailto:${links[key]}`, external: false });
  });

  entries.forEach((entry) => {
    const link = createElement("a", "contact-link");
    link.href = entry.href;
    link.append(createElement("span", "", entry.label), createElement("span", "arrow", "↗"));
    if (entry.external) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
    target.append(link);
  });

  document.querySelectorAll("[data-booking]").forEach((link) => {
    if (links.booking_email) link.href = `mailto:${links.booking_email}`;
  });
};

const setupPlayer = () => {
  const shell = document.querySelector("[data-player]");
  if (!shell) return;
  document.body.append(shell);

  const title = document.querySelector("[data-player-title]");
  const currentTime = document.querySelector("[data-player-current]");
  const durationTime = document.querySelector("[data-player-duration]");
  const progress = document.querySelector("[data-player-progress]");
  const source = document.querySelector("[data-player-source]");
  const artwork = document.querySelector("[data-player-artwork]");
  const toggle = document.querySelector("[data-player-toggle]");
  const closeButton = document.querySelector("[data-player-close]");
  const iframe = document.querySelector("[data-player-frame] iframe");
  const state = { currentTrack: null, duration: 0, isPlaying: false, position: 0, ready: false, timer: null, widget: null };

  const formatTime = (milliseconds) => {
    const seconds = Math.max(0, Math.floor((milliseconds || 0) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };

  const updateTrackButtons = () => {
    document.querySelectorAll(".play-button[data-track-id]").forEach((button) => {
      const active = state.currentTrack?.id === button.dataset.trackId;
      const iconOnly = button.dataset.iconOnly === "true";
      button.classList.toggle("is-playing", active && state.isPlaying);
      button.setAttribute("aria-pressed", String(active && state.isPlaying));
      button.textContent = iconOnly ? (active && state.isPlaying ? "❚❚" : "▶") : (active && state.isPlaying ? "Playing" : button.dataset.defaultLabel);
    });
  };

  const updateUi = () => {
    const ratio = state.duration ? Math.min(state.position / state.duration, 1) : 0;
    title.textContent = state.currentTrack?.title || "";
    artwork.src = state.currentTrack?.artwork || "";
    currentTime.textContent = formatTime(state.position);
    durationTime.textContent = formatTime(state.duration);
    source.href = state.currentTrack?.url || "https://soundcloud.com/agostosound";
    progress.style.setProperty("--progress", String(ratio));
    progress.setAttribute("aria-valuemax", String(Math.round(state.duration)));
    progress.setAttribute("aria-valuenow", String(Math.round(state.position)));
    progress.setAttribute("aria-valuetext", `${formatTime(state.position)} of ${formatTime(state.duration)}`);
    toggle.textContent = state.isPlaying ? "❚❚" : "▶";
    toggle.setAttribute("aria-label", state.isPlaying ? "Pause current track" : "Play current track");
    toggle.setAttribute("aria-pressed", String(state.isPlaying));
    updateTrackButtons();
  };

  const refreshProgress = () => {
    if (!state.widget || !state.ready) return;
    state.widget.getPosition((position) => {
      state.position = position;
      updateUi();
    });
    state.widget.getDuration((duration) => {
      state.duration = duration;
      updateUi();
    });
  };

  const stopProgressTimer = () => {
    if (state.timer) window.clearInterval(state.timer);
    state.timer = null;
  };

  const startProgressTimer = () => {
    stopProgressTimer();
    refreshProgress();
    state.timer = window.setInterval(refreshProgress, 250);
  };

  const showPlayer = () => {
    shell.hidden = false;
    document.body.classList.add("has-player");
  };

  const loadTrack = (track) => {
    state.currentTrack = track;
    state.duration = 0;
    state.position = 0;
    state.isPlaying = false;
    showPlayer();
    updateUi();

    if (state.ready) {
      state.widget.load(track.url, { auto_play: true, hide_related: true, show_comments: false, show_reposts: false, visual: false });
      return;
    }

    initializeWidget(track);
  };

  const seekTo = (ratio) => {
    if (!state.widget || !state.ready || !state.duration) return;
    state.position = Math.round(Math.min(Math.max(ratio, 0), 1) * state.duration);
    state.widget.seekTo(state.position);
    updateUi();
  };

  const soundCloud = window["SC"];
  if (!soundCloud?.Widget) return;
  const bindWidgetEvents = () => {
    state.widget.bind(soundCloud.Widget.Events.READY, () => {
      state.ready = true;
      if (state.currentTrack) loadTrack(state.currentTrack);
    });
    state.widget.bind(soundCloud.Widget.Events.PLAY, () => {
      state.isPlaying = true;
      startProgressTimer();
      updateUi();
    });
    state.widget.bind(soundCloud.Widget.Events.PAUSE, () => {
      state.isPlaying = false;
      stopProgressTimer();
      refreshProgress();
      updateUi();
    });
    state.widget.bind(soundCloud.Widget.Events.FINISH, () => {
      state.isPlaying = false;
      state.position = state.duration;
      stopProgressTimer();
      updateUi();
    });
  };

  const initializeWidget = (track) => {
    iframe.addEventListener("load", () => {
      state.widget = soundCloud.Widget(iframe);
      bindWidgetEvents();
    }, { once: true });
    iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(track.url)}&auto_play=true&hide_related=true&show_comments=false&show_reposts=false&visual=false`;
  };

  const togglePlayback = () => {
    if (!state.currentTrack || !state.ready) return;
    state.widget.isPaused((isPaused) => {
      if (isPaused) state.widget.play();
      else state.widget.pause();
    });
  };

  toggle.addEventListener("click", togglePlayback);
  closeButton.addEventListener("click", () => {
    if (state.ready) state.widget.pause();
    shell.hidden = true;
    document.body.classList.remove("has-player");
  });
  progress.addEventListener("click", (event) => {
    const rect = progress.getBoundingClientRect();
    seekTo((event.clientX - rect.left) / rect.width);
  });
  progress.addEventListener("keydown", (event) => {
    if (!state.duration) return;
    const step = 5000;
    if (event.key === "ArrowLeft") seekTo((state.position - step) / state.duration);
    else if (event.key === "ArrowRight") seekTo((state.position + step) / state.duration);
    else if (event.key === "Home") seekTo(0);
    else if (event.key === "End") seekTo(1);
    else return;
    event.preventDefault();
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-play-url]");
    if (!button) return;
    const releaseArtwork = button.closest(".featured-release-card, .archive-release")?.querySelector("img");
    const track = {
      id: button.dataset.trackId,
      title: button.dataset.trackTitle,
      url: button.dataset.playUrl,
      artwork: releaseArtwork?.currentSrc || releaseArtwork?.src || ""
    };
    if (state.currentTrack?.id === track.id && state.ready) {
      togglePlayback();
      showPlayer();
      return;
    }
    loadTrack(track);
  });
};

const setupAboutToggle = () => {
  const button = document.querySelector("[data-about-toggle]");
  const content = document.querySelector("[data-bio-long]");
  if (!button || !content) return;
  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    content.setAttribute("aria-hidden", String(isOpen));
    content.classList.toggle("is-open", !isOpen);
    content.style.maxHeight = isOpen ? "0px" : `${content.scrollHeight}px`;
    button.textContent = isOpen ? "Read more" : "Read less";
  });
};

const setupNavigation = () => {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-nav]");
  const setHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  setHeader();
  window.addEventListener("scroll", setHeader, { passive: true });

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.querySelector(".sr-only").textContent = isOpen ? "Open navigation" : "Close navigation";
    menu.classList.toggle("is-open", !isOpen);
    document.body.style.overflow = isOpen ? "" : "hidden";
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.querySelector(".sr-only").textContent = "Open navigation";
    menu.classList.remove("is-open");
    document.body.style.overflow = "";
  }));
};

const setupWorldStage = () => {
  const scenes = [...document.querySelectorAll("[data-world-scene]")];
  const images = [...document.querySelectorAll("[data-world-stage-image]")];
  if (!scenes.length || !images.length) return;

  const setActiveScene = (scene) => {
    const activeName = scene.dataset.worldScene;
    images.forEach((image) => {
      image.classList.toggle("is-active", image.dataset.worldStageImage === activeName);
    });
  };

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visibleScene = entries
      .filter((entry) => entry.isIntersecting)
      .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
    if (visibleScene) setActiveScene(visibleScene.target);
  }, { threshold: [.35, .55, .75], rootMargin: "-16% 0px -16%" });

  scenes.forEach((scene) => observer.observe(scene));
};

const setupReveals = () => {
  const items = document.querySelectorAll("[data-reveal]");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: "0px 0px -20px" });
  items.forEach((item) => observer.observe(item));
};

const init = async () => {
  document.querySelectorAll("[data-year]").forEach((year) => {
    year.textContent = String(new Date().getFullYear());
  });
  setupNavigation();
  setupPlayer();
  setupWorldStage();

  try {
    if (document.querySelector("[data-bio-short]")) {
      const [shortBio, longBio, links, releases] = await Promise.all([
        getText(contentFiles.shortBio), getText(contentFiles.longBio), getJson(contentFiles.links), getJson(contentFiles.releases)
      ]);
      fillParagraphs(document.querySelector("[data-bio-short]"), shortBio, true);
      fillParagraphs(document.querySelector("[data-bio-long]"), longBio, true, true);
      renderReleases(releases);
      renderLinks(links);
      setupAboutToggle();
    }
    setupReveals();
  } catch (error) {
    console.error(error);
  }
};

document.addEventListener("DOMContentLoaded", init);
