const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const getPath = (type) => {
    return path.resolve(__dirname, "..", type, `Glotus_Client.user.js`);
}

const app = express();

app.use(cors());
app.get("/", (request, response) => {
    response.send("Hello World!");
})

app.get("/build", (request, response) => {
    const code = fs.readFileSync(getPath("build"), "utf-8");
    response.send(code);
})

app.get("/dist", (request, response) => {
    const code = fs.readFileSync(getPath("dist"), "utf-8");
    response.send(code);
})

app.listen(8081, () => {
    console.log("STARTED SERVER");
})