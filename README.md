# 🍳 FlavorFinder – Smart Recipe Explorer

FlavorFinder is a sophisticated, production-ready web application designed for culinary enthusiasts to discover, explore, and organize recipes from around the globe. Powered by [TheMealDB API](https://www.themealdb.com/), it offers a seamless and interactive experience for finding your next favorite meal.

![FlavorFinder Dashboard Preview](https://via.placeholder.com/800x450?text=FlavorFinder+Dashboard+Preview)

## ✨ Features

- **🔍 Intelligent Search**: Real-time recipe searching with built-in debouncing for optimal performance.
- **🎭 Dynamic Filtering**: Browse recipes by category (Beef, Chicken, Vegetarian, etc.) with instant UI updates.
- **🔢 Smart Sorting**: Organize results alphabetically (A-Z or Z-A) to find exactly what you need.
- **❤️ Favorites System**: Save your preferred recipes to local storage and access them anytime, even after refreshing.
- **📖 Detailed View**: Deep-dive into any recipe with full ingredient lists, measurements, and step-by-step instructions.
- **📺 Multimedia Support**: Direct links to YouTube tutorial videos for visual learners.
- **🌓 Adaptive Theme**: Premium dark and light modes that persist between sessions.
- **📱 Ultra-Responsive**: Designed with a mobile-first approach, ensuring a premium experience across all devices.

## 🛠 Tech Stack

- **HTML5**: Semantic structure for accessibility and SEO.
- **CSS3 (Vanilla)**: Modern design system using CSS variables, glassmorphism, and complex keyframe animations.
- **JavaScript (ES6+)**: Functional programming patterns, API integration, and modular state management.
- **TheMealDB API**: High-quality recipe data source.

## 🔌 API Integration

FlavorFinder integrates with **TheMealDB API** (v1) to fetch high-quality recipe data.
- **Base Endpoint**: `https://www.themealdb.com/api/json/v1/1/search.php?s=`
- **Features Used**: Fetching lists, searching by name, and detailed meal lookups.

## 📂 Project Structure

```text
├── index.html      # Main application entry point and structural layout
├── style.css       # Comprehensive design system and responsive styles
├── script.js      # Core application logic (API, State, UI, Navigation)
└── README.md       # Project documentation
```

## ▶️ How to Run Locally

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/shikharverma018/flavourFinder.git
    ```
2.  **Navigate to the project directory**:
    ```bash
    cd flavourFinder
    ```
3.  **Open in Browser**:
    Simply open the `index.html` file in any modern web browser or use a "Live Server" extension for the best experience.

## ✨ Milestone 4 Enhancements

- **Code Refactoring**: Modularized architecture separating API logic, DOM rendering, and state management.
- **Error Resilience**: Added robust error handling for network failures and invalid responses.
- **Performance Optimization**: Implemented `DocumentFragment` for batched DOM updates and debounced search inputs.
- **UX Polish**: Added dedicated empty states for "No Results Found" and "No Favorites" scenarios.

---

Crafted with ❤️ by Shikhar Verma