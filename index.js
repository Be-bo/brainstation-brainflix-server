import express from "express";
import cors from "cors";
import multer from "multer";
import bodyParser from "body-parser";
import fs from "fs";
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
	cors({
		origin: "*", // Allow requests from any origin
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		credentials: true, // Enable credentials (cookies, authorization headers)
	})
);

app.get("/", (req, res) => {
	res.send("Hello World!");
});

// MARK: MULTER
const storage = multer.diskStorage({
	// Define storage engine and destination
	destination: (req, file, cb) => {
		cb(null, "uploads/");
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(
			null,
			file.fieldname + "-" + uniqueSuffix + "." + file.mimetype.split("/")[1]
		);
	},
});

// MARK: UPLOAD
const upload = multer({ storage: storage });
app.post("/upload", upload.single("image"), (req, res) => {
  console.log("Uploaded JSON data:", req.body.json);

	const jsonData = JSON.parse(req.body.json);
  
	updateDatabase(jsonData)
		.then(() => {
			res.json({ message: "File uploaded and JSON data received successfully." });
		})
		.catch((error) => {
			res.status(500).json({ error: "Failed to update JSON database" });
		});
});

// MARK: JSON
function updateDatabase(newData) {
	const filePath = "db.json";

	return new Promise((resolve, reject) => { // start async

		fs.readFile(filePath, (error, data) => { // read stream
			if (error) {
				console.log(error);
				reject(error);
			} else {
				const json = JSON.parse(data);

				json.items.push(newData); // append new data

				fs.writeFile(filePath, JSON.stringify(json, null, 2), (writeError) => {
					
					if (writeError) { // write stream
						console.log(writeError);
						reject(writeError);
					} else resolve();
				});
			}
		});
	});
}

// MARK: START LISTENING
app.listen(80, () => {
	console.log("Server running on port 80.");
});
