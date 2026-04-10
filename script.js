/**
 * FlavorFinder – Smart Recipe Explorer
 * Milestone 4: Finalization & Optimization
 */

// --- CONFIGURATION ---
const CONFIG = {
  API_BASE_URL: "https://www.themealdb.com/api/json/v1/1/search.php?s=",
  DEBOUNCE_DELAY: 300,
  ANIMATION_STAGGER: 50, // ms
};

// --- API SERVICE ---
const ApiService = {
  async fetchRecipes(query = "") {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${query}`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error("ApiService Error:", error);
      throw error;
    }
  }
};

// --- STATE MANAGEMENT ---
const state = {
  allMeals: [],
  searchQuery: "",
  filterCategory: "All",
  sortOrder: "asc", 
  favorites: JSON.parse(localStorage.getItem("favorites")) || [],
  isDarkMode: localStorage.getItem("theme") !== "light",
  currentView: "home", // "home" or "details"
  selectedMeal: null,
  isLoading: false,
  error: null
};

// --- DOM ELEMENTS ---
const elements = {
  // Views
  listView: document.getElementById("list-view"),
  detailsView: document.getElementById("details-view"),
  
  // Containers
  recipesGrid: document.getElementById("recipes-grid"),
  detailsContent: document.getElementById("details-content"),
  loader: document.getElementById("loader"),
  errorContainer: document.getElementById("error-container"),
  emptyContainer: document.getElementById("empty-container"),
  
  // UI Components
  errorMessage: document.getElementById("error-message"),
  emptyMessage: document.getElementById("empty-message"),
  retryBtn: document.getElementById("retry-btn"),
  searchInput: document.getElementById("search-input"),
  categoryFilter: document.getElementById("category-filter"),
  sortAscBtn: document.getElementById("sort-asc"),
  sortDescBtn: document.getElementById("sort-desc"),
  themeToggle: document.getElementById("theme-toggle"),
  viewFavoritesBtn: document.getElementById("view-favorites-btn"),
  navHome: document.getElementById("nav-home"),
  homeLogo: document.getElementById("home-logo"),
  backBtn: document.getElementById("back-btn"),
  navbar: document.getElementById("navbar")
};

// --- UI HELPERS ---
const UI = {
  showLoader() {
    elements.loader.classList.remove("hidden");
    elements.errorContainer.classList.add("hidden");
    elements.emptyContainer.classList.add("hidden");
    elements.recipesGrid.classList.add("hidden");
  },

  showError(message) {
    elements.loader.classList.add("hidden");
    elements.errorContainer.classList.remove("hidden");
    elements.emptyContainer.classList.add("hidden");
    elements.recipesGrid.classList.add("hidden");
    elements.errorMessage.textContent = message;
  },

  showEmpty(message) {
    elements.loader.classList.add("hidden");
    elements.errorContainer.classList.add("hidden");
    elements.emptyContainer.classList.remove("hidden");
    elements.recipesGrid.classList.add("hidden");
    if (message) elements.emptyMessage.textContent = message;
  },

  showGrid() {
    elements.loader.classList.add("hidden");
    elements.errorContainer.classList.add("hidden");
    elements.emptyContainer.classList.add("hidden");
    elements.recipesGrid.classList.remove("hidden");
  },

  updateTheme() {
    document.body.classList.toggle("light-mode", !state.isDarkMode);
    const themeIcon = elements.themeToggle.querySelector(".theme-icon");
    if (themeIcon) {
      themeIcon.textContent = state.isDarkMode ? "🌙" : "☀️";
    }
  },

  setSortActive(order) {
    elements.sortAscBtn.classList.toggle("active", order === "asc");
    elements.sortDescBtn.classList.toggle("active", order === "desc");
  }
};

// --- DOM RENDERING COMPONENTS ---
const Renderer = {
  /**
   * Creates a single meal card component
   */
  createMealCard(meal, index) {
    const isFavorite = state.favorites.some(fav => fav.idMeal === meal.idMeal);
    
    const card = document.createElement("article");
    card.className = `recipe-card ${isFavorite ? "is-favorite" : ""}`;
    card.style.animationDelay = `${index * (CONFIG.ANIMATION_STAGGER / 1000)}s`;
    
    card.innerHTML = `
      <div class="card-image-wrapper">
        <button class="fav-btn ${isFavorite ? "active" : ""}" data-id="${meal.idMeal}" title="${isFavorite ? "Remove from favorites" : "Add to favorites"}">
          ❤️
        </button>
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="card-image" loading="lazy">
      </div>
      <div class="card-body">
        <h3 class="card-title">${meal.strMeal}</h3>
        <div class="card-meta">
          ${meal.strCategory ? `<span class="meta-tag meta-tag-category"><span class="meta-tag-icon">🍽</span>${meal.strCategory}</span>` : ""}
          ${meal.strArea ? `<span class="meta-tag meta-tag-area"><span class="meta-tag-icon">📍</span>${meal.strArea}</span>` : ""}
        </div>
      </div>
    `;

    // Event Listeners for the card
    card.addEventListener("click", (e) => {
      // Don't navigate if clicking the favorite button
      if (e.target.closest(".fav-btn")) return;
      Navigation.goToDetails(meal);
    });

    const favBtn = card.querySelector(".fav-btn");
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      Actions.toggleFavorite(meal);
    });

    return card;
  },

  /**
   * Renders the grid of meals
   */
  renderMealGrid(meals) {
    elements.recipesGrid.innerHTML = "";
    
    if (!meals || meals.length === 0) {
      const emptyMsg = state.viewingFavorites 
        ? "You haven't added any favorites yet. Start exploring!" 
        : "No recipes found matching your search. Try another keyword!";
      UI.showEmpty(emptyMsg);
      return;
    }

    const fragment = document.createDocumentFragment();
    meals.forEach((meal, index) => {
      fragment.appendChild(this.createMealCard(meal, index));
    });
    
    elements.recipesGrid.appendChild(fragment);
    UI.showGrid();
  },

  /**
   * Renders the meal details view
   */
  renderDetails(meal) {
    if (!meal) return;
    
    const isFavorite = state.favorites.some(fav => fav.idMeal === meal.idMeal);
    
    // Parse ingredients using HOF
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

    document.getElementById("details-fav-btn").addEventListener("click", () => Actions.toggleFavorite(meal));
  }
};

// --- CORE ACTIONS ---
const Actions = {
  async fetchAndStoreRecipes() {
    UI.showLoader();
    try {
      state.allMeals = await ApiService.fetchRecipes();
      this.refreshRecipes();
    } catch (error) {
      UI.showError("Failed to load recipes. Please check your internet connection and try again.");
    }
  },

  refreshRecipes() {
    if (state.currentView === "details") return;

    // Filter and Sort Logic
    const baseMeals = state.viewingFavorites ? state.favorites : state.allMeals;
    
    const processed = baseMeals
      .filter(meal => {
        const matchesSearch = meal.strMeal.toLowerCase().includes(state.searchQuery.toLowerCase());
        const matchesCategory = state.filterCategory === "All" || meal.strCategory === state.filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const nameA = a.strMeal.toUpperCase();
        const nameB = b.strMeal.toUpperCase();
        const comparison = nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
        return state.sortOrder === "asc" ? comparison : -comparison;
      });

    // Update Favorite Toggle UI
    if (state.viewingFavorites) {
      elements.viewFavoritesBtn.classList.add("active");
      elements.viewFavoritesBtn.querySelector(".btn-text").textContent = "Show All Meals";
    } else {
      elements.viewFavoritesBtn.classList.remove("active");
      elements.viewFavoritesBtn.querySelector(".btn-text").textContent = "View Favorites";
    }

    Renderer.renderMealGrid(processed);
  },

  toggleFavorite(meal) {
    const index = state.favorites.findIndex(fav => fav.idMeal === meal.idMeal);
    
    if (index > -1) {
      state.favorites.splice(index, 1);
    } else {
      state.favorites.push(meal);
    }
    
    localStorage.setItem("favorites", JSON.stringify(state.favorites));
    
    // Refresh UI
    this.refreshRecipes();
    
    // If in details view, update that as well
    if (state.currentView === "details" && state.selectedMeal?.idMeal === meal.idMeal) {
      Renderer.renderDetails(meal);
    }
  },

  toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    localStorage.setItem("theme", state.isDarkMode ? "dark" : "light");
    UI.updateTheme();
  }
};

// --- NAVIGATION ---
const Navigation = {
  goToDetails(meal) {
    state.currentView = "details";
    state.selectedMeal = meal;
    
    elements.listView.classList.add("hidden");
    elements.detailsView.classList.remove("hidden");
    
    Renderer.renderDetails(meal);
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  goHome() {
    state.currentView = "home";
    state.selectedMeal = null;
    
    elements.detailsView.classList.add("hidden");
    elements.listView.classList.remove("hidden");
    
    Actions.refreshRecipes();
  },

  resetFilters() {
    state.searchQuery = "";
    state.filterCategory = "All";
    state.sortOrder = "asc";
    state.viewingFavorites = false;
    
    // Sync DOM
    elements.searchInput.value = "";
    elements.categoryFilter.value = "All";
    UI.setSortActive("asc");
    
    this.goHome();
  }
};

// --- EVENT INIT ---
function initEventListeners() {
  // Search with Debounce
  const handleSearch = Utils.debounce((e) => {
    state.searchQuery = e.target.value;
    Actions.refreshRecipes();
  }, CONFIG.DEBOUNCE_DELAY);
  
  elements.searchInput.addEventListener("input", handleSearch);

  // Filters & Sorting
  elements.categoryFilter.addEventListener("change", (e) => {
    state.filterCategory = e.target.value;
    Actions.refreshRecipes();
  });

  elements.sortAscBtn.addEventListener("click", () => {
    state.sortOrder = "asc";
    UI.setSortActive("asc");
    Actions.refreshRecipes();
  });

  elements.sortDescBtn.addEventListener("click", () => {
    state.sortOrder = "desc";
    UI.setSortActive("desc");
    Actions.refreshRecipes();
  });

  // UI Toggles
  elements.themeToggle.addEventListener("click", () => Actions.toggleTheme());
  
  elements.viewFavoritesBtn.addEventListener("click", () => {
    state.viewingFavorites = !state.viewingFavorites;
    Actions.refreshRecipes();
  });

  // Navigation
  elements.navHome.addEventListener("click", () => Navigation.resetFilters());
  elements.homeLogo.addEventListener("click", (e) => {
    e.preventDefault();
    Navigation.resetFilters();
  });
  elements.backBtn.addEventListener("click", () => Navigation.goHome());
  elements.retryBtn.addEventListener("click", () => Actions.fetchAndStoreRecipes());

  // Visual Effects
  window.addEventListener("scroll", () => {
    elements.navbar.classList.toggle("scrolled", window.scrollY > 20);
  });
}

// --- UTILITIES ---
const Utils = {
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }
};

// --- INITIALIZE APP ---
function init() {
  UI.updateTheme();
  initEventListeners();
  Actions.fetchAndStoreRecipes();
}

// Start
document.addEventListener("DOMContentLoaded", init);