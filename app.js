const express = require('express');
const app = express();
const cors = require('cors')
const http = require('http');
const server = http.createServer(app);
const bodyParser = require('body-parser');
const upload = require("express-fileupload");
const port = process.env.PORT || 3000
const { Expo } = require('expo-server-sdk')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static('files'));
app.use('files',require("express").static(__dirname + 'files'))
app.use(cors());
app.use(upload());
let expo = new Expo();
const {apiHandlerMysql} = require('./api/mysql')

apiHandlerMysql(app)
app.get('/', (req, res) => {
    res.sendFile( __dirname + "/" + "index.html" );
});
const sendPushNotification = async (to,body) => {
    const messages = [
        {
            to,
            sound: 'default',
            body,
            data: {},
        }
    ]
    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
        try {
          let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log(ticketChunk);
        } catch (error) {
          console.error(error);
        }
    }
}
server.listen(port, () => {
    //sendPushNotification("ExponentPushToken[1Qh0jLCoV5kZiMt-mkCSkh]","Hello This is a test Data lol")
    console.log(`listening on ${port}`);
});