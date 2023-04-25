require('dotenv').config();
const express = require('express');
const app = express();
const axios = require('axios')
const FormData = require('form-data')
const multer = require('multer');
const cors = require('cors');
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() }).single('document');

app.post('/convert', async (req, res) => {
  upload(req, res, async function () {
    const formData = new FormData()
    formData.append('instructions', JSON.stringify({
      parts: [
        {
          file: "document"
        }
      ]
    }))
    formData.append('document', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    })

    try {
      const response = await axios.post('https://api.pspdfkit.com/build', formData, {
        headers: formData.getHeaders({
          'Authorization': process.env.API_KEY
        }),
        responseType: "stream"
      })

      res.set({
        'Content-Disposition': `attachment; filename=result.pdf`,
        'Content-Type': 'application/pdf'
      })

      response.data.pipe(res)
    } catch (e) {
      const errorString = await streamToString(e.response.data)
      console.log(errorString)
      res.status(500).send(errorString)
    }
  })
});

function streamToString(stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on("error", (err) => reject(err))
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
  })
}

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
})
