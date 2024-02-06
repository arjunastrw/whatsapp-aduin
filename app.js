const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000; // Atur port sesuai kebutuhan

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Whatsapp-Adu.in',
    password: '1202201379',
    port: 5432,
});

app.use(bodyParser.json());

// Endpoint untuk menghandle QR Code
app.get('/qrcode', (req, res) => {
    // Proses QR Code di sini jika diperlukan
    res.send('QR Code endpoint');
});

// Endpoint untuk menghandle pesan dari website
app.post('/message', async (req, res) => {
    try {
        const { phone_number, body } = req.body;

        // Proses pesan dari website sesuai kebutuhan
        // ...

        res.status(200).json({ message: 'Pesan diterima dan sedang diproses.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan dalam pemrosesan pesan.' });
    }
});

// Endpoint untuk mengambil semua keluhan
app.get('/complaints', async (req, res) => {
    try {
        const query = 'SELECT * FROM user_complaints;';
        const result = await pool.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tidak ada keluhan yang ditemukan.' });
        }

        const allComplaints = result.rows;
        res.status(200).json(allComplaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan dalam mengambil keluhan.' });
    }
});

// Endpoint untuk mengambil informasi keluhan dari website berdasarkan nomor telepon
app.get('/complaints/:phone_number', async (req, res) => {
    try {
        const phone_number = req.params.phone_number;

        const query = `SELECT * FROM user_complaints WHERE phone_number = $1;`;
        const result = await pool.query(query, [phone_number]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Keluhan tidak ditemukan.' });
        }

        const complaintInfo = result.rows[0];
        res.status(200).json(complaintInfo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan dalam mengambil informasi keluhan.' });
    }
});

// Endpoint untuk Mengirim Pesan Balasan ke Nomor Telepon Tertentu
app.post('/reply', async (req, res) => {
    try {
        const { phone_number, message } = req.body;

        // Logic untuk mengirim pesan balasan ke nomor telepon tertentu
        // ...

        res.status(200).json({ message: 'Pesan balasan berhasil dikirim.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengirim pesan balasan.' });
    }
});

//Endpoint untuk Mengelola Kategori Keluhan
app.post('/complaints/:id/category', async (req, res) => {
    try {
        const id = req.params.id;
        const { category } = req.body;

        const query = `UPDATE user_complaints SET kategori = $1 WHERE id = $2 RETURNING id;`;
        const result = await pool.query(query, [category, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Gagal mengubah kategori keluhan.' });
        }

        res.status(200).json({ message: 'Kategori keluhan berhasil diubah.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan dalam mengubah kategori keluhan.' });
    }
});

//Endpoint untuk Mengelola Lokasi Keluhan
app.post('/complaints/:id/location', async (req, res) => {
    try {
        const id = req.params.id;
        const { latitude, longitude } = req.body;

        const query = `UPDATE user_complaints SET latitude = $1, longitude = $2 WHERE id = $3 RETURNING id;`;
        const result = await pool.query(query, [latitude, longitude, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Gagal mengubah lokasi keluhan.' });
        }

        res.status(200).json({ message: 'Lokasi keluhan berhasil diubah.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Terjadi kesalahan dalam mengubah lokasi keluhan.' });
    }
});


app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
