import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import fs from 'fs';
import faker from 'faker';
import { v4 as uuidv4 } from 'uuid';
const app = express();


// MARK: VARS
const videosPath = 'db/videos.json';
const videoDetailsPath = 'db/video-details.json';
const thumbnailsPath = 'public';
// const serverAddress = 'http://localhost:80';
const serverAddress = 'http://3.145.198.110:80';
let generatedFilename = '';


// MARK: SETUP
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: '*', // Allow requests from any origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable credentials (cookies, authorization headers)
  })
);
app.use('/'+thumbnailsPath, express.static('public'));


// MARK: FUNCTIONS
function generateRandomInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getVideoPreviewInfo(parsedVideoDetails){
  let videoPreviewInfo = {
    id: parsedVideoDetails.id,
    title: parsedVideoDetails.title,
    channel: parsedVideoDetails.channel,
    image: parsedVideoDetails.image
  }

  return videoPreviewInfo;
}

function generateFullVideoDetails(parsedPartialDetails, thumbnailName){
  parsedPartialDetails.id = uuidv4();
  parsedPartialDetails.image = serverAddress + '/' + thumbnailsPath + '/' + thumbnailName; // to make a publicly accessible URL
  parsedPartialDetails.comments = [];
  parsedPartialDetails.duration = 0;
  parsedPartialDetails.video = 'https://project-2-api.herokuapp.com/stream';
  parsedPartialDetails.views = generateRandomInt(50, 100000);
  parsedPartialDetails.likes = generateRandomInt(10, 10000);
  parsedPartialDetails.channel = faker.internet.userName();
  parsedPartialDetails.timestamp = new Date().getTime();

  return parsedPartialDetails;
}

function generateCommentDetails(commentText){
  let parsedComment = {};
  parsedComment.id = uuidv4();
  parsedComment.name = faker.internet.userName();
  parsedComment.comment = commentText;
  parsedComment.timestamp = new Date().getTime();
  parsedComment.likes = generateRandomInt(10, 500);

  return parsedComment;
}

function appendNewVideoDetails(stringifiedVideoDetails, thumbnailName) {
  return new Promise(async (resolve, reject) => {
    try{

      const parsedVideoDetails = JSON.parse(stringifiedVideoDetails);

      // Video Details
      let localJSON = await fs.promises.readFile(videoDetailsPath, 'utf-8');
      let parsedJSON = JSON.parse(localJSON);
      parsedJSON.items.push(generateFullVideoDetails(parsedVideoDetails, thumbnailName));
      await fs.promises.writeFile(videoDetailsPath, JSON.stringify(parsedJSON, null, 2));

      // Videos (preview info)
      localJSON = await fs.promises.readFile(videosPath, 'utf-8');
      parsedJSON = JSON.parse(localJSON);
      parsedJSON.items.push(getVideoPreviewInfo(parsedVideoDetails));
      await fs.promises.writeFile(videosPath, JSON.stringify(parsedJSON, null, 2));

      resolve();

    }catch (error){
      console.log(error);
      reject(error);
    }
  });
}

function appendToComments(commentText, videoId){
  return new Promise(async (resolve, reject) =>{
    try{
      const fileData = await fs.promises.readFile(videoDetailsPath, 'utf-8');
      const parsedJSON = JSON.parse(fileData);
      const videoObject = parsedJSON.items.find((item) => {
        return item.id == videoId;
      });
      videoObject.comments.push(generateCommentDetails(commentText));
      await fs.promises.writeFile(videoDetailsPath, JSON.stringify(parsedJSON, null, 2));
      resolve();
    }catch(error){
      console.log(error);
      reject(error);
    }
  });
}

function getStringifiedVideosJSON(){
  return new Promise(async (resolve, reject) => {
    try{
       const stringifiedVideos = await fs.promises.readFile(videosPath, 'utf-8');
       resolve(stringifiedVideos);
    }catch(error){
      console.log(error);
      reject(error);
    }
  });
}

function getStringifiedVideoDetailsJSON(videoId){
  return new Promise(async(resolve, reject) =>{
    try{
      const stringifiedVideoDetails = await fs.promises.readFile(videoDetailsPath, 'utf-8');
      const parsedVideoDetails = JSON.parse(stringifiedVideoDetails);
      const parsedVideo = parsedVideoDetails.items.find((item) =>{
        return item.id == videoId;
      });
      const stringifiedVideo = JSON.stringify(parsedVideo, null, 2);
      resolve(stringifiedVideo);
    }catch(error){
      console.log(error);
      reject(error);
    }
  });
}


// MARK: SAVING FILES
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, thumbnailsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    generatedFilename = file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1];
    cb(null, generatedFilename);
  },
});
const upload = multer({ storage: storage });





// ************************************* REST *************************************

// MARK: HELLO WORLD
app.get('/', (req, res) => {
  console.log('Hello World!');
  res.send('Hello World!'); // non JSON / plan tuxt
});


// MARK: GET VIDEOS INFO
app.get('/videos', async (req, res) => {
  try{
    const returnJSON = await getStringifiedVideosJSON();
    res.json({
      message: 'Video info list retrieved successfully.',
      data: returnJSON,
    })
  }catch(error){
    res.status(500).json({error: 'Failed to retrieve video info list.'})
  }
});


// MARK: GET VIDEO DETAILS
app.get('/videos/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  try{
    const returnJSON = await getStringifiedVideoDetailsJSON(videoId);
    res.json({
      message: 'Video data retrieved succesfully.',
      data: returnJSON,
    });
  }catch(error){
    res.status(500).json({ error: 'Failed to retrieve video details.' });
  }
});


// MARK: POST COMMENT
app.post('/videos/:videoId/comment', async (req, res) => {
  const videoId = req.params.videoId;
  try{
    await appendToComments(req.body['comment-text'], videoId);
    res.json({ message: 'Comment added successfully.'});
  }catch(error){
    res.status(500).json({error: 'Failed to add comment'});
  }
});


// MARK: POST VIDEO
app.post('/upload', upload.single('image'), async (req, res) => {
  try{
    await appendNewVideoDetails(req.body.json, generatedFilename);
    res.json({message: 'File uploaded and JSON data received successfully.',});
  }catch(error){
    res.status(500).json({error: 'Failed to update JSON database',});
  }
});


// MARK: SERVER LAUNCH
app.listen(80, () => {
  console.log('Server running on port 80.');
});