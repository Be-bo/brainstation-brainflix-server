import express from 'express';
import cors from 'cors';
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

app.post("/upload", (req, res) => {
	res.send("UPLOAD RECEIVED");
});