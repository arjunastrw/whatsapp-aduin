const qrcode = require("qrcode-terminal");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const {
  Client,
  LegacySessionAuth,
  LocalAuth,
  MessageMedia,
} = require("whatsapp-web.js");
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "client-one", //Un identificador(Sugiero que no lo modifiques)
  }),
});

const pool = new Pool({
  user: "postgres",
  host: "aduindb_container",
  database: "aduindb",
  password: "12345",
  port: 5432,
});

// Save session values to the file upon successful auth
client.on("authenticated", (session) => {
  console.log(session);
});

client.initialize();
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("ready to message");
});

const conversationContext = {};

client.on("message", async (message) => {
  const senderPhoneNumber = message.from;

  // Check if there is an existing context for this sender
  if (!conversationContext[senderPhoneNumber]) {
    conversationContext[senderPhoneNumber] = {
      count: 1,
      insertedId: 0,
      // ... (any other user-specific data you want to store)
    };
  }

  const currentContext = conversationContext[senderPhoneNumber];

  const contact = await message.getContact();
  const senderName = contact.pushname || "Nama Pengirim Tidak Diketahui";

  const lowercaseBody = message.body.toLowerCase().trim();
  let replyMessage; // Declare replyMessage here

  if (
    currentContext.count === 1 &&
    !lowercaseBody.includes("nama") &&
    !lowercaseBody.includes("keluhan") &&
    !lowercaseBody.includes("detail keluhan")
  ) {
    // Step 2
    replyMessage =
      "Terima kasih telah menghubungi Adu.In, Pesan Anda telah terbaca secara otomatis. Untuk terhubung dengan admin, silahkan tinggalkan pesan Anda kembali dengan format berikut. \nNama: \nKeluhan: \nDetail Keluhan:";
    await message.reply(replyMessage);
  } else if (
    currentContext.count === 1 &&
    (lowercaseBody.includes("nama") ||
      lowercaseBody.includes("keluhan") ||
      lowercaseBody.includes("detail keluhan"))
  ) {
    //( currentContext.count === 1 && lowercaseBody.includes('nama') && lowercaseBody.includes('keluhan') && lowercaseBody.includes('detail keluhan'))
    // Step 3
    currentContext.count = 2;
    const complainNo = await generateRandomComplainNo();
    replyMessage =
      "Silahkan pilih satu kategori keluhan yang sesuai dengan mengetik angkanya saja Pilihan kategori keluhan:\n(1) Pelayanan Administrasi Publik\n(2) Korupsi dan Penyalahgunaan Kekuasaan \n(3) Transparansi dan Akuntabilitas\n(4) Usaha dan Investasi\n(5) Kesejahteraan Tenaga Kerja\n(6) Pasar dan Konsumen\n(7) Pengelolaan Keuangan Publik\n(8) Perbankan dan Jasa Keuangan\n(9) Investasi dan Pasar Keuangan\n(10) Infrastruktur Publik\n(11) Lingkungan dan Konservasi\n(12) Pembangunan Wilayah\n(13) Pelayanan Kesehatan\n(14) Pendidikan dan Keterampilan\n(15) Kesejahteraan Sosial";
    const timestamp = getCurrentTimestamp();
    // ... (rest of the code)
    await message.reply(replyMessage);

    // Placeholder for database query, replace with your actual query
    const insertComplaintQuery = `
            INSERT INTO complaints (title, description, complain_no, created_at, date, is_anonymous, status)
            VALUES ($1, $2, $3, $4, $5, true, 'Open')
            RETURNING id;
        `;

    const titleRegex = /Keluhan: (.+)(?:\r|\n|$)/;
    const detailKeluhanRegex = /Detail Keluhan: (.+)(?:\r|\n|$)/;

    const titleMatch = message.body && message.body.match(titleRegex);
    const detailKeluhanMatch =
      message.body && message.body.match(detailKeluhanRegex);

    const title = titleMatch ? titleMatch[1].trim() : null;
    const detailKeluhan = detailKeluhanMatch
      ? detailKeluhanMatch[1].trim()
      : null;

    const insertComplaintValues = [
      title,
      detailKeluhan,
      complainNo,
      timestamp,
      timestamp,
    ];

    // Execute the database query and get the inserted row's ID
    const result = await pool.query(
      insertComplaintQuery,
      insertComplaintValues
    );
    currentContext.insertedId = result.rows[0].id;
  } else if (
    currentContext.count === 2 &&
    message.type === "chat" &&
    [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
    ].includes(lowercaseBody)
  ) {
    currentContext.count = 3;
    await updateDatabase(message, currentContext.insertedId);

    const replyMessage =
      'Terima kasih telah menghubungi kami, silahkan kirimkan foto keluhan Anda jika ada. Jika tidak, silahkan ketika "Tidak ada"';
    await message.reply(replyMessage);
  } else if (
    currentContext.count === 2 &&
    message.type === "chat" &&
    ![
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
    ].includes(lowercaseBody)
  ) {
    const replyMessage =
      "Cukup ketik angka kategori keluhannya saja \nPilihan kategori keluhan:\n(1) Pelayanan Administrasi Publik\n(2) Korupsi dan Penyalahgunaan Kekuasaan \n(3) Transparansi dan Akuntabilitas\n(4) Usaha dan Investasi\n(5) Kesejahteraan Tenaga Kerja\n(6) Pasar dan Konsumen\n(7) Pengelolaan Keuangan Publik\n(8) Perbankan dan Jasa Keuangan\n(9) Investasi dan Pasar Keuangan\n(10) Infrastruktur Publik\n(11) Lingkungan dan Konservasi\n(12) Pembangunan Wilayah\n(13) Pelayanan Kesehatan\n(14) Pendidikan dan Keterampilan\n(15) Kesejahteraan Sosial";
    await message.reply(replyMessage);
  } else if (message.type === "image" && currentContext.count === 3) {
    // Handle image upload
    const imagePath = await handleImageUpload(
      currentContext.insertedId,
      senderName
    );
    currentContext.count = 4; // Change currentContext.count to 3
    // Update complaint_evidence table with imagePath
    await updateComplaintEvidence(imagePath, currentContext.insertedId);
    replyMessage = "Terima kasih, silahkan share lokasi keluhan Anda.";
    await message.reply(replyMessage);
  } else if (
    lowercaseBody.includes("tidak ada") &&
    currentContext.count === 3
  ) {
    // Step 7
    currentContext.count = 4; // Change currentContext.count to 3
    replyMessage = "Terima kasih, silahkan share lokasi keluhan Anda.";
    await message.reply(replyMessage);
  } else if (
    message.type != "image" &&
    currentContext.count === 3 &&
    !lowercaseBody.includes("tidak ada")
  ) {
    // Step 8
    replyMessage =
      'Silahkan kirimkan foto keluhan Anda jika ada. Jika tidak, silahkan ketika "Tidak ada".';
    await message.reply(replyMessage);
  } else if (currentContext.count === 4) {
    // Step 9
    currentContext.count = 0; // Change count to 0
    await handleSharedLocation(message, currentContext.insertedId);

    replyMessage = "Lokasi keluhan Anda telah diterima. Terima kasih!";
    await message.reply(replyMessage);
    setTimeout(() => {
      currentContext.count = 1;
    }, 61200000); // Reset count to 1 after 1 minute
  }

  async function updateDatabase(message, insertedId) {
    const updateImageQuery = `
            UPDATE complaints
            SET category_id = $1
            WHERE id = $2
        `;
    const updateImageValues = [
      message.body, // Assuming the image URL is in the message body
      insertedId,
    ];

    const result = await pool.query(updateImageQuery, updateImageValues);
  }

  // Helper function to generate random complain number
  // Helper function to generate random complain number
  async function generateRandomComplainNo() {
    let randomNo;
    let count;
    do {
      // Generate a random 12-digit number
      randomNo = Math.floor(
        100000000000 + Math.random() * 900000000000
      ).toString();
      // Check if the generated number already exists in the complaint_no column
      const checkDuplicateQuery =
        "SELECT COUNT(*) FROM complaints WHERE complain_no = $1";
      const checkDuplicateValues = [randomNo];
      const result = await pool.query(
        checkDuplicateQuery,
        checkDuplicateValues
      );
      count = parseInt(result.rows[0].count);
    } while (count > 0); // Loop until a unique number is generated
    return randomNo;
  }

  // Helper function to get current timestamp
  function getCurrentTimestamp() {
    return new Date().toISOString();
  }

  function generateRandomString(length) {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let randomString = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * letters.length);
      randomString += letters.charAt(randomIndex);
    }
    return randomString;
  }

  async function handleImageUpload(insertedId, senderName) {
    const media = await message.downloadMedia();
    const randomLetters = generateRandomString(12);
    const directoryPath = `../service-complaint/storage/evidences/0`;
    const imageFileName = `${insertedId}_${senderName}_${randomLetters}.jpg`;

    // Create the directory if it doesn't exist
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const filePath = path.join(__dirname, directoryPath, imageFileName); // Use path.join to ensure cross-platform compatibility
    fs.writeFileSync(filePath, media.data, "base64");

    // Construct the full image URL using the BASE_URL environment variable
    // const imagePath = process.env.BASE_URL ? `${process.env.BASE_URL}/api/complaints/storage/evidences/0/${imageFileName}` : undefined;
    const basePath = "http://localhost:8003/api/complaints";
    const imagePath = `${basePath}/storage\\evidences\\0\\${insertedId}_${senderName}_${randomLetters}.jpg`;
    return imagePath;
  }

  // Placeholder for database query to update complaint_evidence table, replace with actual query
  async function updateComplaintEvidence(imagePath, insertedId) {
    const insertEvidenceQuery = `
                INSERT INTO complaint_evidence(complaint_id, evidence_type, url, created_at)
                VALUES($1, 'image', $2, $3);
                `;

    const insertEvidenceValues = [insertedId, imagePath, getCurrentTimestamp()];

    await pool.query(insertEvidenceQuery, insertEvidenceValues);
  }

  // Placeholder for database query to update complaint location, replace with
  async function handleSharedLocation(message, insertedId) {
    if (message.type === "location") {
      // If the message is a shared location
      const location = message.location;
      const updatedLocation = `${location.latitude}, ${location.longitude}`;

      // Add any other properties you want to extract from the location

      // You can add additional logic here to further process the location if needed

      await updateComplaintLocation(updatedLocation, insertedId);
    } else if (message.type === "chat") {
      // If the message is a chat message
      const chatMessage = message.body; // Extract the message content
      await updateComplaintLocation(chatMessage, insertedId); // Pass the message content to the function
    }

    // Return null if the message type is not location
    return null;
  }

  async function updateComplaintLocation(updatedLocation, insertedId) {
    // Update the location column of complaints table
    const updateLocationQuery = `
                UPDATE complaints
                SET location = $1
                WHERE id = $2;
                `;

    const updateLocationValues = [updatedLocation, insertedId];

    await pool.query(updateLocationQuery, updateLocationValues);
  }
});
