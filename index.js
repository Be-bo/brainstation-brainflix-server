import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(cors({
  origin: '*', // Allow requests from any origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Enable credentials (cookies, authorization headers)
}));

app.get("/", (req, res)=>{
	res.send("Hello World!");
});



// MARK: MULTER
const storage = multer.diskStorage({ // Define storage engine and destination
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
  },
});
const upload = multer({ storage: storage }); // upload
app.post("/upload", upload.single('image'), (req, res) => { // upload
	res.send("UPLOAD RECEIVED");
});



// MARK: START LISTENING
app.listen(80, ()=>{
	console.log("Server running on port 80.");
});
