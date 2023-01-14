const express = require('express');
const app = express();
const cors = require('cors')
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
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
const { Configuration, OpenAIApi } = require("openai");
const {apiHandlerMysql} = require('./api/mysql')
const {dbConnection} = require('./connection');

//apiHandler(app) // passing the app instance to the apiHandler method to work with routes using mongo
apiHandlerMysql(app) // passing the app instance to the apiHandler method to work with routes using mysql
//apiHandlerPG(app) // passing the app instance to the apiHandler method to work with routes using postgres

app.get('/', (req, res) => {
    res.sendFile( __dirname + "/" + "index.html" );
});
server.listen(port, () => {
    console.log(`listening on ${port}`);
    dbConnection('mysql',(connection)=>{
        connection.getConnection((err,conn) => {  
            if (!!err) {
                console.log("database Access Denied "+err);
            }else{
                conn.release();
                console.log("database Access granted");
            }
        });
    })
});
app.get('/openai', (req, res) => {
    testModel(res)
});
const testModel = async(res) => {
    const configuration = new Configuration({
        apiKey: "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",
      });
      const openai = new OpenAIApi(configuration);
      
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        max_tokens:4000,
        prompt: "Generate a business plan based on a construction company that uses drones",
      });
      res.send(completion.data.choices[0].text)
}