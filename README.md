# Bloxtory - Share Your Stories

![Bloxtory Logo](src/public/images/bloxtory_logo.png)

**Bloxtory** adalah Progressive Web Application (PWA) untuk berbagi cerita dengan lokasi geografis menggunakan peta interaktif. Platform ini memungkinkan pengguna untuk membagikan pengalaman mereka dengan foto, deskripsi, dan lokasi yang terintegrasi dengan peta Leaflet.

**Live Demo**: [https://bloxtory.netlify.app/](https://bloxtory.netlify.app/)

---

## Fitur Utama

### Autentikasi
- **Registrasi** dan **Login** pengguna
- Manajemen session dengan localStorage
- Protected routes untuk halaman tertentu

### Manajemen Cerita
- **Tambah cerita** dengan foto, deskripsi, dan lokasi
- **Upload foto** dari perangkat
- **Geolokasi otomatis** menggunakan browser geolocation API
- **Filter dan sorting** cerita berdasarkan tanggal atau popularitas
- **Detail cerita** dengan tampilan lengkap

### Peta Interaktif
- Integrasi **Leaflet.js** untuk peta interaktif
- Marker untuk setiap cerita dengan koordinat geografis
- Popup informasi cerita di peta
- Clustering untuk banyak marker

### Progressive Web App (PWA)
- **Installable** - Dapat diinstall sebagai aplikasi native
- **Offline capable** - Service Worker untuk caching
- **Background Sync** - Sinkronisasi data di background
- **Push Notifications** - Notifikasi untuk update
- **Responsive Design** - Optimal di mobile dan desktop

### Penyimpanan Lokal
- **IndexedDB** untuk data persistence
- **Saved Stories** - Simpan cerita favorit secara offline
- Cache strategy untuk performance optimal

---

## Teknologi yang Digunakan

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Webpack** - Module bundler
- **Babel** - JavaScript transpiler

### Libraries & Frameworks
- **Leaflet.js** - Interactive maps
- **Service Worker** - Offline functionality
- **IndexedDB** - Client-side storage
- **Web API** - Geolocation, Notification, Background Sync

### Build Tools
- Webpack 5
- Webpack Dev Server
- Babel Loader
- CSS & Style Loader
- Clean & Copy Webpack Plugin

---

## Struktur Project

```
bloxtory/
├── dist/                           # Compiled production files
├── src/                            # Source files
│   ├── index.html                  # Main HTML file
│   ├── manifest.json               # PWA manifest
│   ├── struktur.txt                # Project structure reference
│   ├── public/                     # Public assets
│   │   ├── images/                 # Image assets
│   │   │   ├── bloxtory_logo.png
│   │   │   ├── bloxtory_logo1.png  # 192x192 icon
│   │   │   ├── bloxtory_logo2.png  # 512x512 icon
│   │   │   ├── logo.png
│   │   │   ├── screenshot-desktop.png
│   │   │   └── screenshot-mobile.png
│   │   └── sw.js                   # Service Worker
│   ├── scripts/                    # JavaScript modules
│   │   ├── index.js                # Entry point
│   │   ├── app.js                  # Main app logic
│   │   ├── data/                   # API layer
│   │   │   ├── api.js              # Story API
│   │   │   └── auth-api.js         # Authentication API
│   │   ├── pages/                  # Page components
│   │   │   ├── about/
│   │   │   │   └── about-page.js
│   │   │   ├── add-story/
│   │   │   │   └── add-story-page.js
│   │   │   ├── auth/
│   │   │   │   ├── login-page.js
│   │   │   │   └── register-page.js
│   │   │   ├── home/
│   │   │   │   └── home-page.js
│   │   │   ├── map/
│   │   │   │   └── map-page.js
│   │   │   ├── saved-stories/
│   │   │   │   └── saved-stories-page.js
│   │   │   └── settings/
│   │   │       └── settings-page.js
│   │   ├── presenters/             # Business logic layer
│   │   │   ├── add-story-presenter.js
│   │   │   ├── auth-presenter.js
│   │   │   ├── home-presenter.js
│   │   │   └── map-presenter.js
│   │   ├── routes/                 # Routing
│   │   │   ├── routes.js
│   │   │   └── url-parser.js
│   │   └── utils/                  # Utility functions
│   │       ├── background-sync.js  # Background sync
│   │       ├── idb-helper.js       # IndexedDB helper
│   │       ├── leaflet-config.js   # Leaflet configuration
│   │       ├── notification-helper.js
│   │       ├── service-worker-register.js
│   │       └── transition.js       # Page transitions
│   └── styles/                     # CSS files
│       └── styles.css              # Main stylesheet
├── .gitignore
├── bloxtory_project.zip            # Project archive
├── CODE_QUALITY_IMPROVEMENTS.md    # Quality improvements documentation
├── package.json                    # Dependencies
├── package-lock.json               # Dependency lock file
├── README.md                       # Project documentation
├── STUDENT.txt                     # Student information
├── webpack.common.js               # Common webpack config
├── webpack.dev.js                  # Development config
└── webpack.prod.js                 # Production config
```

---

## Getting Started

### Prerequisites

Pastikan Anda telah menginstall:
- **Node.js** (versi 14 atau lebih tinggi)
- **npm** atau **yarn**

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/bloxtory.git
   cd bloxtory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi API** (Opsional)
   
   Jika menggunakan API eksternal, buat file `.env` atau update `STUDENT.txt`:
   ```
   APP_URL=https://bloxtory.netlify.app/
   MAP_SERVICE_API_KEY=your_api_key_here
   ```

### Development

Jalankan development server dengan hot reload:

```bash
npm run start-dev
```

Aplikasi akan berjalan di `http://localhost:8080`

### Production Build

Build aplikasi untuk production:

```bash
npm run build
```

File hasil build akan tersedia di folder `dist/`

### Serve Production Build

Test production build secara lokal:

```bash
npm run serve
```

### Code Formatting

Format kode dengan Prettier:

```bash
npm run format
```

---

## Fitur PWA

### Manifest Configuration

Aplikasi dilengkapi dengan `manifest.json` yang mendukung:
- App name dan short name
- Icons (192x192 dan 512x512)
- Theme color
- Display mode: standalone
- Screenshots untuk mobile dan desktop
- Shortcuts untuk akses cepat

### Service Worker

Service Worker (`sw.js`) menyediakan:
- **Cache-first strategy** untuk assets statis
- **Network-first strategy** untuk API calls
- **Background sync** untuk operasi offline
- **Push notifications**

### Offline Support

Aplikasi dapat berfungsi offline dengan:
- Caching halaman utama
- IndexedDB untuk penyimpanan data
- Background sync untuk sinkronisasi saat online kembali

---

## Cara Menggunakan

### 1. Register/Login
- Buka aplikasi
- Klik tombol **Register** untuk membuat akun baru
- Atau **Login** jika sudah memiliki akun

### 2. Menambah Cerita
- Klik tombol **Add Story** atau ikon **+**
- Upload foto dari perangkat
- Isi deskripsi cerita
- Izinkan akses lokasi atau input koordinat manual
- Klik **Submit**

### 3. Melihat Cerita di Peta
- Navigasi ke halaman **Map**
- Lihat semua cerita dalam bentuk marker di peta
- Klik marker untuk melihat detail cerita

### 4. Filter & Sort
- Di halaman **Home**, gunakan filter untuk menampilkan cerita tertentu
- Sort berdasarkan tanggal terbaru atau popularitas

### 5. Save Stories
- Simpan cerita favorit untuk akses offline
- Akses di menu **Saved Stories**

---

## API Integration

### Authentication Endpoints

```javascript
// Register
POST /register
Body: { name, email, password }

// Login
POST /login
Body: { email, password }
```

### Stories Endpoints

```javascript
// Get all stories
GET /stories

// Get story detail
GET /stories/:id

// Add new story
POST /stories
Headers: { Authorization: Bearer <token> }
Body: FormData { description, photo, lat, lon }
```

---

## Architecture Pattern

Project ini menggunakan **MVP (Model-View-Presenter)** pattern:

- **Model**: Data layer (API, IndexedDB)
- **View**: Page components (HTML rendering)
- **Presenter**: Business logic layer (handling user interaction)

### Flow Diagram

```
User Interaction
      ↓
   Page (View)
      ↓
  Presenter (Logic)
      ↓
   API/IDB (Model)
      ↓
  Presenter (Process)
      ↓
   Page (Render)
```

---

## Security Features

- **Input Validation** - Validasi di client dan server
- **Input Sanitization** - Mencegah XSS attacks
- **Authentication** - Token-based authentication
- **HTTPS** - Secure connection
- **File Validation** - Validasi tipe dan ukuran file

---

## Quality Improvements

Project ini telah ditingkatkan dengan:

**Enhanced Error Handling**
- Proper error handling di semua layer
- User-friendly error messages
- Error logging dengan context

**Input Validation**
- Email validation
- Password validation (min 8 karakter)
- Coordinate validation
- Image file validation

**Code Organization**
- Clean code principles
- Separation of concerns
- Reusable utilities
- Consistent naming conventions

**Performance Optimization**
- Code splitting
- Lazy loading
- Asset optimization
- Efficient caching strategy

Lihat [CODE_QUALITY_IMPROVEMENTS.md](CODE_QUALITY_IMPROVEMENTS.md) untuk detail lengkap.

---

## Troubleshooting

### Service Worker tidak terdaftar
```bash
# Clear browser cache
# Hard reload: Ctrl+Shift+R (Windows) atau Cmd+Shift+R (Mac)
```

### Build gagal
```bash
# Hapus node_modules dan reinstall
rm -rf node_modules package-lock.json
npm install
```

### Geolocation tidak bekerja
- Pastikan aplikasi diakses melalui HTTPS
- Berikan izin lokasi di browser

---

## Contributing

Kontribusi sangat diterima! Silakan:

1. Fork repository
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

---

## License

Project ini menggunakan lisensi **ISC License**.

---

## Author

**Bloxtory Developer**

- Email: worklifeariqfadhil@gmail.com
- Website: [bloxtory.netlify.app](https://bloxtory.netlify.app/)

---

## Acknowledgments

- [Dicoding Academy](https://www.dicoding.com/) - Learning platform
- [Leaflet.js](https://leafletjs.com/) - Interactive maps
- [Webpack](https://webpack.js.org/) - Module bundler
- Komunitas open source yang luar biasa

---

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Webpack Guides](https://webpack.js.org/guides/)

---

Jika project ini bermanfaat, jangan lupa berikan star!