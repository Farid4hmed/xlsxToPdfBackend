require('dotenv').config();
const express = require('express');
const app = express();
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const multer = require('multer')
const cors = require('cors');
app.use(cors());
const upload = multer({ dest: 'uploads/' })

app.post('/convert', upload.single('document'), async (req, res) => {
  const formData = new FormData()
  formData.append('instructions', JSON.stringify({
    parts: [
      {
        file: "document"
      }
    ]
  }))
  formData.append('document', fs.createReadStream(req.file.path))

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

function streamToString(stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on("error", (err) => reject(err))
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
  })
}

const port = process.env.PORT || 8000;
const host = process.env.HOST || `localhost`;

app.listen(port, () => {
  console.log(`Server is up and running at http://${host}:${port}`);
});