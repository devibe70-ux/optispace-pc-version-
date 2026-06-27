<div align="center">
  <!-- Replace the src below with the logo file from Nano Banana -->
  <img src="docs/logo.png" alt="App Logo" width="150"/>

  # OptiSpace AI
  **The On-Device Storage Optimizer & AI Deduplication Engine**

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Platform: iOS | Android | Windows | macOS](https://img.shields.io/badge/Platforms-iOS%20%7C%20Android%20%7C%20Windows%20%7C%20macOS-lightgrey.svg)]()
  [![AI: Local](https://img.shields.io/badge/AI-100%25%20Local-success.svg)]()
</div>

## 📌 What is it?
This project is an intelligent storage optimization utility designed to reclaim massive amounts of space on smartphones and desktop computers. Unlike traditional cleaners that rely on exact file hashes, this app uses local Machine Learning models to find "fuzzy" duplicates (like burst shots, resized images, or heavily edited documents) and offers contextual, hardware-accelerated video compression.

All processing happens **100% on-device**. No files are ever sent to a server, ensuring absolute privacy and zero infrastructure scaling costs.

## ✨ Core Features
*   🧠 **AI Visual Deduplication:** Uses quantized neural networks to detect visually similar photos and automatically recommends the lowest-quality versions for deletion.
*   🎥 **Contextual Video Compression:** Leverages native hardware encoders (NVENC, Apple Media Engine) to compress large videos up to 50% more efficiently than legacy codecs with no perceptible quality loss.
*   🔒 **Privacy-First Architecture:** Completely disconnected local processing.
*   ⚡ **Cross-Platform Delivery:** Includes a mobile client optimized for strict thermal/battery efficiency and a heavy-duty PC client packaged as a clean **MSIX** installer for massive file systems.

## 🚀 Getting Started

### Prerequisites
*   **Mobile:** Flutter or React Native SDK
*   **PC:** Rust/C++ build tools and Node.js

### Installation

**Mobile Build (iOS/Android)**
```bash
git clone https://github.com/yourusername/optispace-ai.git
cd optispace-ai/mobile
# Run your respective framework install commands here
```

**Desktop Build (Windows MSIX / macOS)**
```bash
cd optispace-ai/desktop
npm install
npm run build
# The MSIX package will be output to the /dist folder
```

## 🛠️ Architecture Overview
* **Mobile UI:** Flutter / React Native
* **Desktop UI:** Tauri / Electron
* **Core Traversal Logic:** Rust / C++
* **AI Engine Native Bindings:** CoreML (Apple), ML Kit (Android), DirectML (Windows)

## 🤝 Contributing
Contributions are welcome! Please check the Issues page to see what features we are currently prioritizing.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
