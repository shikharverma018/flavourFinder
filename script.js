const API_URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=";

const recipesGrid = document.getElementById("recipes-grid");
const loader = document.getElementById("loader");
const errorContainer = document.getElementById("error-container");
const errorMessage = document.getElementById("error-message");
const retryBtn = document.getElementById("retry-btn");
const navbar = document.getElementById("navbar");

function showLoader() {
  loader.classList.remove("hidden");
  errorContainer.classList.add("hidden");
  recipesGrid.classList.add("hidden");
}

function showError(message) {
  loader.classList.add("hidden");
  errorContainer.classList.remove("hidden");
  recipesGrid.classList.add("hidden");
  errorMessage.textContent = message;
}

function showGrid() {
  loader.classList.add("hidden");
  errorContainer.classList.add("hidden");
  recipesGrid.classList.remove("hidden");
}

function createRecipeCard(meal, index) {
  const card = document.createElement("article");
  card.classList.add("recipe-card");
  card.style.animationDelay = `${index * 0.07}s`;

  const imageWrapper = document.createElement("div");
  imageWrapper.classList.add("card-image-wrapper");

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

  if (meal.strCategory) {
    const categoryTag = document.createElement("span");
    categoryTag.classList.add("meta-tag", "meta-tag-category");

    const categoryIcon = document.createElement("span");
    categoryIcon.classList.add("meta-tag-icon");
    categoryIcon.textContent = "🍽";

    const categoryText = document.createTextNode(meal.strCategory);
    categoryTag.appendChild(categoryIcon);
    categoryTag.appendChild(categoryText);
    meta.appendChild(categoryTag);
  }

  if (meal.strArea) {
    const areaTag = document.createElement("span");
    areaTag.classList.add("meta-tag", "meta-tag-area");

    const areaIcon = document.createElement("span");
    areaIcon.classList.add("meta-tag-icon");
    areaIcon.textContent = "📍";

    const areaText = document.createTextNode(meal.strArea);
    areaTag.appendChild(areaIcon);
    areaTag.appendChild(areaText);
    meta.appendChild(areaTag);
  }

  body.appendChild(title);
  body.appendChild(meta);
  card.appendChild(imageWrapper);
  card.appendChild(body);

  return card;
}

function renderRecipes(meals) {
  recipesGrid.textContent = "";

  if (!meals || meals.length === 0) {
    showError("No recipes found. Try again later.");
    return;
  }

  const fragment = document.createDocumentFragment();
  meals.forEach(function (meal, index) {
    fragment.appendChild(createRecipeCard(meal, index));
  });

  recipesGrid.appendChild(fragment);
  showGrid();
}

async function fetchRecipes() {
  showLoader();

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }

    const data = await response.json();
    renderRecipes(data.meals);
  } catch (error) {
    showError(
      "We couldn\u2019t fetch the recipes. Please check your connection and try again."
    );
  }
}

retryBtn.addEventListener("click", fetchRecipes);

window.addEventListener("scroll", function () {
  if (window.scrollY > 20) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

fetchRecipes();
