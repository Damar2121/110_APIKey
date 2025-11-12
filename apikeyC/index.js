const express = require('express');
const path = require('path');
const crypto = require('crypto'); // Sudah benar
const app = express();
const port = 3000;

// --- PENYEMPURNAAN ---
// Definisikan prefix di satu tempat.
// Jadi kalau mau ganti, cukup ganti di sini.
const API_PREFIX = 'sk-itumy-v1-api_';

// Middleware
// FIX 1: 'dirname' diubah menjadi '__dirname' (dengan dua underscore)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Route utama kirim index.html
app.get('/', (req, res) => {
  // FIX 2: 'dirname' diubah menjadi '__dirname'
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔑 Route untuk generate API key dengan prefix
app.post('/apikeyc/create', (req, res) => {
  try {
    const rawKey = crypto.randomBytes(32).toString('hex');
    
    // FIX 3: String harus pakai backticks (``) atau tanda kutip (+)
    // Variabel tidak bisa langsung ditempel seperti itu.
    const apiKey = `${API_PREFIX}${rawKey}`;

    res.json({
      success: true,
      apiKey: apiKey
    });
  } catch (err) {
    console.error('Error generate API key:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat API key'
    });
  }
});

// ✅ Route untuk cek validitas API key
app.post('/checkapi', (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key tidak ditemukan dalam request body'
      });
    }

    // Gunakan konstanta yang sudah didefinisi di atas
    if (!apiKey.startsWith(API_PREFIX)) {
      return res.status(400).json({
        success: false,
        message: 'Format API key tidak valid'
      });
    }

    // Gunakan konstanta lagi
    const rawPart = apiKey.replace(API_PREFIX, '');

    // Logika regex Anda sudah TEPAT! 32 bytes = 64 karakter hex.
    const isHex = /^[a-f0-9]{64}$/i.test(rawPart);
    if (!isHex) {
      return res.status(400).json({
        success: false,
        message: 'API key tidak valid (harus 64 karakter hex)'
      });
    }

    // --- CATATAN PENTING ADA DI BAWAH ---
    return res.json({
      success: true,
      message: 'Format API key valid'
    });
  } catch (err) {
    console.error('Error checking API key:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memeriksa API key'
    });
  }
});


app.listen(port, () => {
  // FIX 4: console.log perlu tanda kutip
  console.log(`Server berjalan di http://localhost:${port}`);
});