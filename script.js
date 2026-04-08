const API_URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=";

// --- STATE MANAGEMENT ---
const state = {
  allMeals: [],
  searchQuery: "",
  filterCategory: "All",
  sortOrder: "asc", 
  favorites: JSON.parse(localStorage.getItem("favorites")) || [],
  isDarkMode: localStorage.getItem("theme") !== "light",
  viewingFavorites: false,
  currentView: "home", // "home", "details"
  previousView: "home",
  selectedMeal: null
};

// --- DOM ELEMENTS ---
const elements = {
  mainContent: document.getElementById("main-content"),
  listView: document.getElementById("list-view"),
  detailsView: document.getElementById("details-view"),
  detailsContent: document.getElementById("details-content"),
  recipesGrid: document.getElementById("recipes-grid"),
  loader: document.getElementById("loader"),
  errorContainer: document.getElementById("error-container"),
  errorMessage: document.getElementById("error-message"),
  retryBtn: document.getElementById("retry-btn"),
  navbar: document.getElementById("navbar"),
  searchInput: document.getElementById("search-input"),
  categoryFilter: document.getElementById("category-filter"),
  sortAscBtn: document.getElementById("sort-asc"),
  sortDescBtn: document.getElementById("sort-desc"),
  themeToggle: document.getElementById("theme-toggle"),
  viewFavoritesBtn: document.getElementById("view-favorites-btn"),
  navHome: document.getElementById("nav-home"),
  homeLogo: document.getElementById("home-logo"),
  backBtn: document.getElementById("back-btn")
};

// --- UI HELPERS ---
function showLoader() {
  elements.loader.classList.remove("hidden");
  elements.errorContainer.classList.add("hidden");
  elements.recipesGrid.classList.add("hidden");
}

function showError(message) {
  elements.loader.classList.add("hidden");
  elements.errorContainer.classList.remove("hidden");
  elements.recipesGrid.classList.add("hidden");
  elements.errorMessage.textContent = message;
}

function showGrid() {
  elements.loader.classList.add("hidden");
  elements.errorContainer.classList.add("hidden");
  elements.recipesGrid.classList.remove("hidden");
}

// --- NAVIGATION LOGIC ---
function navigateTo(view, meal = null) {
  state.previousView = state.currentView;
  state.currentView = view;
  state.selectedMeal = meal;

  if (view === "details") {
    elements.listView.classList.add("hidden");
    elements.detailsView.classList.remove("hidden");
    renderDetails(meal);
    window.scrollTo(0, 0);
  } else {
    elements.detailsView.classList.add("hidden");
    elements.listView.classList.remove("hidden");
    handleStateChange(); // Refresh list view based on state
  }
}

function goBack() {
  if (state.currentView === "details") {
    navigateTo(state.previousView);
  }
}

function resetToHome() {
  state.searchQuery = "";
  state.filterCategory = "All";
  state.sortOrder = "asc";
  state.viewingFavorites = false;
  
  // Reset UI elements
  elements.searchInput.value = "";
  elements.categoryFilter.value = "All";
  elements.sortAscBtn.classList.add("active");
  elements.sortDescBtn.classList.remove("active");
  
  navigateTo("home");
}

// --- DATA HANDLING ---
function getProcessedMeals() {
  const baseMeals = state.viewingFavorites ? state.favorites : state.allMeals;

  return baseMeals
    .filter(meal => {
      const matchesSearch = meal.strMeal.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchesCategory = state.filterCategory === "All" || meal.strCategory === state.filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const nameA = a.strMeal.toUpperCase();
      const nameB = b.strMeal.toUpperCase();
      if (state.sortOrder === "asc") {
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
      } else {
        return nameA > nameB ? -1 : nameA < nameB ? 1 : 0;
      }
    });
}

function toggleFavorite(meal) {
  const isFav = state.favorites.find(fav => fav.idMeal === meal.idMeal);
  if (isFav) {
    state.favorites = state.favorites.filter(fav => fav.idMeal !== meal.idMeal);
  } else {
    state.favorites = [...state.favorites, meal];
  }
  localStorage.setItem("favorites", JSON.stringify(state.favorites));
  handleStateChange();
  
  // Update details view if we are looking at it
  if (state.currentView === "details" && state.selectedMeal?.idMeal === meal.idMeal) {
    renderDetails(meal);
  }
}

// --- RENDERING ---
function createRecipeCard(meal, index) {
  const isFavorite = state.favorites.find(fav => fav.idMeal === meal.idMeal);
  const card = document.createElement("article");
  card.classList.add("recipe-card");
  if (isFavorite) card.classList.add("is-favorite");
  card.style.animationDelay = `${index * 0.05}s`;

  // Navigate to details on click
  card.addEventListener("click", () => navigateTo("details", meal));

  const favBtn = document.createElement("button");
  favBtn.classList.add("fav-btn");
  if (isFavorite) favBtn.classList.add("active");
  favBtn.innerHTML = "❤️";
  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(meal);
  });

  const imageWrapper = document.createElement("div");
  imageWrapper.classList.add("card-image-wrapper");
  imageWrapper.appendChild(favBtn);

  const img = document.createElement("img");
  img.classList.add("card-image");
  img.src = meal.strMealThumb;
  img.alt = meal.strMeal;
  img.loading = "lazy";
  imageWrapper.appendChild(img);

  const body = document.createElement("div");
  body.classList.add("card-body");

  const title = document.createElement("h3");
  title.classList.add("card-title");
  title.textContent = meal.strMeal;

  const meta = document.createElement("div");
  meta.classList.add("card-meta");
  
  [
    { text: meal.strCategory, icon: "🍽", class: "meta-tag-category" },
    { text: meal.strArea, icon: "📍", class: "meta-tag-area" }
  ].filter(t => t.text).forEach(tag => {
    const span = document.createElement("span");
    span.classList.add("meta-tag", tag.class);
    span.innerHTML = `<span class="meta-tag-icon">${tag.icon}</span>${tag.text}`;
    meta.appendChild(span);
  });

  body.appendChild(title);
  body.appendChild(meta);
  card.appendChild(imageWrapper);
  card.appendChild(body);

  return card;
}

function renderDetails(meal) {
  if (!meal) return;
  const isFavorite = state.favorites.find(fav => fav.idMeal === meal.idMeal);
  
  // Extract ingredients using HOF (No loops)
  const ingredients = Array.from({ length: 20 })
    .map((_, i) => ({
      name: meal[`strIngredient${i + 1}`],
      measure: meal[`strMeasure${i + 1}`]
    }))
    .filter(item => item.name && item.name.trim() !== "");

  elements.detailsContent.innerHTML = `
    <header class="details-header">
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="details-img">
      <div class="details-header-overlay">
        <div class="details-title-row">
          <h1>${meal.strMeal}</h1>
          <button class="fav-btn active-large ${isFavorite ? "active" : ""}" id="details-fav-btn">❤️</button>
        </div>
        <div class="details-meta-large">
          <span class="meta-tag meta-tag-category">${meal.strCategory}</span>
          <span class="meta-tag meta-tag-area">${meal.strArea}</span>
        </div>
      </div>
    </header>
    <div class="details-body">
      <aside class="details-ingredients">
        <h3>Ingredients</h3>
        <ul class="ingredients-list">
          ${ingredients.map(ing => `
            <li>
              <span>${ing.name}</span>
              <span>${ing.measure}</span>
            </li>
          `).join("")}
        </ul>
      </aside>
      <article class="details-instructions">
        <h3>Instructions</h3>
        <p class="instructions-text">${meal.strInstructions}</p>
      </article>
    </div>
    ${meal.strYoutube ? `
      <div class="video-section">
        <a href="${meal.strYoutube}" target="_blank" rel="noopener noreferrer" class="video-link">
          📺 Watch Recipe Video
        </a>
      </div>
    ` : ""}
  `;

  document.getElementById("details-fav-btn").addEventListener("click", () => toggleFavorite(meal));
}

function renderRecipes(meals) {
  elements.recipesGrid.innerHTML = "";
  if (!meals || meals.length === 0) {
    const msg = state.viewingFavorites 
      ? "No favorites added yet. ❤️ some recipes to see them here!" 
      : "No recipes found matching your criteria.";
    showError(msg);
    return;
  }

  const fragment = document.createDocumentFragment();
  meals.forEach((meal, index) => fragment.appendChild(createRecipeCard(meal, index)));
  elements.recipesGrid.appendChild(fragment);
  showGrid();
}

function handleStateChange() {
  if (state.currentView === "details") return;

  const processedMeals = getProcessedMeals();
  
  // Update toggle button UI
  if (state.viewingFavorites) {
    elements.viewFavoritesBtn.classList.add("active");
    elements.viewFavoritesBtn.querySelector(".btn-text").textContent = "Show All Meals";
  } else {
    elements.viewFavoritesBtn.classList.remove("active");
    elements.viewFavoritesBtn.querySelector(".btn-text").textContent = "View Favorites";
  }

  renderRecipes(processedMeals);
}

// --- UTILITIES ---
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

function applyTheme() {
  if (state.isDarkMode) {
    document.body.classList.remove("light-mode");
  } else {
    document.body.classList.add("light-mode");
  }
}

// --- EVENT LISTENERS ---
function initEventListeners() {
  elements.searchInput.addEventListener("input", debounce((e) => {
    state.searchQuery = e.target.value;
    handleStateChange();
  }, 300));

  elements.categoryFilter.addEventListener("change", (e) => {
    state.filterCategory = e.target.value;
    handleStateChange();
  });

  elements.sortAscBtn.addEventListener("click", () => {
    state.sortOrder = "asc";
    elements.sortAscBtn.classList.add("active");
    elements.sortDescBtn.classList.remove("active");
    handleStateChange();
  });

  elements.sortDescBtn.addEventListener("click", () => {
    state.sortOrder = "desc";
    elements.sortDescBtn.classList.add("active");
    elements.sortAscBtn.classList.remove("active");
    handleStateChange();
  });

  elements.themeToggle.addEventListener("click", () => {
    state.isDarkMode = !state.isDarkMode;
    localStorage.setItem("theme", state.isDarkMode ? "dark" : "light");
    applyTheme();
  });

  elements.viewFavoritesBtn.addEventListener("click", () => {
    state.viewingFavorites = !state.viewingFavorites;
    handleStateChange();
  });

  elements.navHome.addEventListener("click", resetToHome);
  elements.homeLogo.addEventListener("click", (e) => {
    e.preventDefault();
    resetToHome();
  });
  elements.backBtn.addEventListener("click", goBack);
  elements.retryBtn.addEventListener("click", fetchRecipes);

  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) elements.navbar.classList.add("scrolled");
    else elements.navbar.classList.remove("scrolled");
  });
}

// --- INITIALIZATION ---
async function fetchRecipes() {
  showLoader();
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Server error: " + response.status);
    const data = await response.json();
    state.allMeals = data.meals || [];
    handleStateChange();
  } catch (error) {
    showError("We couldn’t fetch the recipes. Please check your connection.");
  }
}

function init() {
  applyTheme();
  initEventListeners();
  fetchRecipes();
}

init();