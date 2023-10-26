import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import fs from 'fs';
const app = express();


// MARK: VARS
const videosPath = '/uploads/videos.json';
const videoDetailsPath = '/uploads/video-details.json';
const thumbnailsPath = '/uploads/thumbnails/';


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
function getVideoPreviewInfo(parsedVideoDetails){
  let videoPreviewInfo = {
    id: parsedVideoDetails.id,
    title: parsedVideoDetails.title,
    channel: parsedVideoDetails.channel,
    image: parsedVideoDetails.image
  }

  return videoPreviewInfo;
}

function appendNewVideoDetails(stringifiedVideoDetails) {
  return new Promise(async (resolve, reject) => {
    try{

      const parsedVideoDetails = JSON.parse(stringifiedVideoDetails);

      let localJSON = await fs.promises.readFile(videoDetailsPath);
      let parsedJSON = JSON.parse(localJSON);
      parsedJSON.items.push(parsedVideoDetails); // assuming the uploaded json payload will already be in the video-details format
      await fs.promises.writeFile(videoDetailsPath, JSON.stringify(parsedJSON, null, 2));

      localJSON = await fs.promises.readFile(videosPath);
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

function appendToComments(stringifiedComment, videoId){
  return new Promise(async (resolve, reject) =>{
    try{
      const parsedComment = JSON.parse(stringifiedComment);
      const fileData = await fs.promises.readFile(videoDetailsPath);
      const parsedJSON = JSON.parse(fileData);
      const videoObject = parsedJSON.items.find((item) => {
        return item.id == videoId;
      });
      videoObject.comments.push(parsedComment);
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
       const stringifiedVideos = await fs.promises.readFile(videosPath);
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
      const stringifiedVideoDetails = fs.promises.readFile(videoDetailsPath);
      const parsedVideoDetails = JSON.parse(stringifiedVideoDetails);
      const parsedVideo = parsedVideoDetails.items.find((item) =>{
        item.id == videoId;
      });
      const stringifiedVideo = JSON.stringify(parsedVideo, null, 2);
      resolve(stringifiedVideo);
    }catch(error){
      console.log(error);
      reject(error);
    }
  });
}

function getThumbnailLocalPath(videoId){ //
  return new Promise(async (resolve, reject) => {
    try{

      const stringifiedLocalVideos = await fs.promises.readFile(videosPath);
      const parsedLocalVideos = JSON.parse(stringifiedLocalVideos);
      const parsedVideo = parsedLocalVideos.items.find((item) => {
        return item.id == videoId;
      });
      resolve(thumbnailsPath.concat(parsedVideo.image));
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
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]
    );
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


// MARK: GET VIDEO THUMBNAIL
app.get('videos/:videoId/thumbnail', async (req, res) => {
  const videoId = req.params.videoId;
  try{
    const imagePath = await getThumbnailLocalPath(videoId);
    res.setHeader('Content-Type', 'image/*');
    res.sendFile(imagePath);
  }catch(error){
    res.status(500).json({error: 'Failed to retrieve thumbnail image.'});
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
    await appendToComments(req.body.json, videoId);
    res.json({ message: 'Comment added successfully.'});
  }catch(error){
    res.status(500).json({error: 'Failed to add comment'});
  }
});


// MARK: POST VIDEO
app.post('/upload', upload.single('image'), async (req, res) => {
  try{

    // TODO: deal with the image name

    await appendNewVideoDetails(req.body.json);
    res.json({message: 'File uploaded and JSON data received successfully.',});
  }catch(error){
    res.status(500).json({error: 'Failed to update JSON database',});
  }
});


// MARK: SERVER LAUNCH
app.listen(80, () => {
  console.log('Server running on port 80.');
});
