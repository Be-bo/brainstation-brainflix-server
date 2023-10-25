// MARK: VARS
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import fs from 'fs';
const app = express();


// MARK: SETUP
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: '*', // Allow requests from any origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable credentials (cookies, authorization headers)
  })
);


// MARK: FUNCTIONS
function updateDatabase(newData) {
  const filePath = 'db.json';

  return new Promise((resolve, reject) => {

    fs.readFile(filePath, (error, data) => {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        const json = JSON.parse(data);

        json.items.push(newData);

        fs.writeFile(filePath, JSON.stringify(json, null, 2), (writeError) => {
          if (writeError) {
            console.log(writeError);
            reject(writeError);
          } else resolve();
        });
      }
    });
  });
}

function appendVideos(){

}

function appendVideoDetails(){

}

function appendComments(){

}



// MARK: SAVING FILES
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]
    );
  },
});
const upload = multer({ storage: storage });



// MARK: HELLO WORLD
app.get('/', (req, res) => {
  console.log('Hello World!');
  res.send('Hello World!');
});


// MARK: GET VIDEOS INFO
app.get('/videos', (req, res) => {});


// MARK: GET VIDEO THUMBNAIL
app.get('videos/:videoId/thumbnail', (req, res) => {
  const videoId = req.params.videoId;
});


// MARK: GET VIDEO DETAILS
app.get('/videos/:videoId', (req, res) => {
  const videoId = req.params.videoId;
});


// MARK: POST COMMENT
app.post('/videos/:videoId/comment', (req, res) => {
  const videoId = req.params.videoId;
});


// MARK: POST VIDEO
app.post('/upload', upload.single('image'), (req, res) => {
  console.log('Uploaded JSON data:', req.body.json);

  const jsonData = JSON.parse(req.body.json);

  updateDatabase(jsonData)
    .then(() => {
      res.json({
        message: 'File uploaded and JSON data received successfully.',
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: 'Failed to update JSON database',
      });
    });
});


// MARK: SERVER LAUNCH
app.listen(80, () => {
  console.log('Server running on port 80.');
});
