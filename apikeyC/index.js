const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3000;

// --- BAGIAN 1: KONEKSI DATABASE ---
// Gunakan 'mysql2/promise' agar bisa pakai async/await
const mysql = require('mysql2/promise'); 

// Definisikan prefix di satu tempat
const API_PREFIX = 'sk-itumy-v1-api_';

// Buat 'Pool' Koneksi. Pool lebih efisien daripada koneksi tunggal.
// Ganti ini dengan kredensial database Anda
const pool = mysql.createPool({
  host: 'localhost',      // atau IP server DB Anda
  user: 'root',           // user DB Anda
  password: '200421D@m2121', // password DB Anda
  database: 'apikey',
  port: 3309, // nama database Anda
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Route utama kirim index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- BAGIAN 2: MODIFIKASI ROUTE '/apikeyc/create' ---
// Kita ubah menjadi 'async' untuk menunggu query DB
app.post('/apikeyc/create', async (req, res) => {
  try {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const apiKey = `${API_PREFIX}${rawKey}`;

    // --- LOGIKA BARU: Simpan ke Database ---
    // Jalankan kueri INSERT
    await pool.query('INSERT INTO api_keys (api_key) VALUES (?)', [apiKey]);
    // ------------------------------------

    res.json({
      success: true,
      apiKey: apiKey
    });
  } catch (err) {
    // Tangani error, misal jika key duplikat (meski kemungkinannya kecil)
    console.error('Error generate atau simpan API key:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat API key'
    });
  }
});

// --- BAGIAN 3: MODIFIKASI ROUTE '/checkapi' (Inti Permintaan Anda) ---
// Kita ubah menjadi 'async' untuk menunggu query DB
app.post('/checkapi', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false, message: 'API key tidak ditemukan'
      });
    }

    // 1. Validasi Format (Fast Fail)
    //    Ini bagus untuk performa, jadi kita tidak perlu query DB
    //    jika formatnya saja sudah jelas salah.
    if (!apiKey.startsWith(API_PREFIX)) {
      return res.status(400).json({
        success: false, message: 'Format API key tidak valid'
      });
    }

    // 2. Validasi Keberadaan (Database Check)
    // --- LOGIKA BARU: Cek ke Database ---
    const [rows] = await pool.query(
      'SELECT api_key FROM api_keys WHERE api_key = ? LIMIT 1', 
      [apiKey]
    );
    // ----------------------------------
    
    // Jika 'rows' punya isi (panjangnya > 0), berarti key ditemukan
    if (rows.length > 0) {
      return res.json({
        success: true,
        message: 'API key valid dan terdaftar'
      });
    } else {
      // Jika tidak ada hasil, key tidak valid/tidak terdaftar
      return res.status(401).json({ // 401 = Unauthorized
        success: false,
        message: 'API key tidak valid atau tidak terdaftar'
      });
    }

  } catch (err) {
    console.error('Error checking API key:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memeriksa API key'
    });
  }
});


app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
  console.log('Terhubung ke database MySQL...');
});