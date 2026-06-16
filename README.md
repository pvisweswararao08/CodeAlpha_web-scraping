# 📚 BookVault — Book Discovery Dashboard

> A stunning web scraping project that collects **1,000 books** from [books.toscrape.com](https://books.toscrape.com) and displays them in a beautiful interactive dashboard.

![BookVault Dashboard](https://img.shields.io/badge/Books-1%2C000-blue?style=flat-square) ![Categories](https://img.shields.io/badge/Categories-50-purple?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

- 🌙☀️ **Dark / Light mode toggle** — remembers your preference
- 📖 **3D book flip** — hover any book cover to see it swing open
- 🔍 **Smart filters** — search by title, filter by category, rating & price
- 📊 **Analytics charts** — category breakdown, rating distribution, price ranges
- 📚 **3 view modes** — Grid, List & Bookshelf
- 🖱️ **Cursor halo** & **nebula particle canvas** — interactive ambient effects
- 📱 **Fully responsive** — works on all screen sizes

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Scraping | Python 3, BeautifulSoup 4, Scrapy |
| Data | JSON (1,000 books, 13 fields each) |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Charts | Chart.js |
| Fonts | Fraunces (serif), Plus Jakarta Sans |

---

## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/bookvault.git
cd bookvault

# Serve locally (Python required)
python -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

> ⚠️ You must use a local server (not `file://`) because the app fetches `data.json` via HTTP.

---

## 📁 File Structure

```
website/
├── index.html      # Main HTML structure
├── style.css       # Complete design system (light + dark themes)
├── app.js          # All JavaScript logic
└── data.json       # 1,000 scraped books dataset
```

---

## 📊 Dataset

| Field | Description |
|---|---|
| `title` | Book title |
| `price_gbp` | Price in GBP |
| `rating` | Star rating (1–5) |
| `category` | Genre / Category |
| `availability` | In Stock / Out of Stock |
| `image` | Cover image URL |
| `url` | Original book page URL |

---

## 🌐 Live Demo

Hosted on **EdgeOne Pages** → [your-url-here.edgeone.app](https://your-url-here.edgeone.app)

---

## 📝 License

MIT — free to use and modify.
