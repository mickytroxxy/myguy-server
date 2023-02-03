const express = require('express');
const app = express();
const cors = require('cors')
const http = require('http');
const server = http.createServer(app);
const bodyParser = require('body-parser');
const upload = require("express-fileupload");
const port = process.env.PORT || 3000


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static('files'));
app.use('files',require("express").static(__dirname + 'files'))
app.use(cors());
app.use(upload());

const {apiHandlerMysql} = require('./api/route')
apiHandlerMysql(app)
app.get('/', (req, res) => {
    res.sendFile( __dirname + "/" + "index.html" );
});
server.listen(port, () => {
    //sendPushNotification("ExponentPushToken[1Qh0jLCoV5kZiMt-mkCSkh]","Hello This is a test Data lol")
    console.log(`listening on ${port}`);
});