const {Client} = require('pg')

const client = new Client({
    host: "localhost",
    user: "lameckndhlovu",
    port: 5432,
    password: "",
    database: "lameckndhlovu"
})
client.connect()

const apiHandlerPG = (app) => {
    app.get('/users', (req, res)=>{
        console.log("We here bussy")
        client.query(`Select * from users`, (err, result)=>{
            if(!err){
                res.send(result.rows);
            }
        });
        client.end;
    })
    app.get('/users/:id', (req, res)=>{
        client.query(`Select * from users where id=${req.params.id}`, (err, result)=>{
            if(!err){
                res.send(result.rows);
            }
        });
        client.end;
    })
    app.post('/users', (req, res)=> {
        const user = req.body;
        let insertQuery = `insert into users(id, firstname, lastname, location) values(${user.id}, '${user.firstname}', '${user.lastname}', '${user.location}')`
        client.query(insertQuery, (err, result)=>{
            if(!err){
                res.send('Insertion was successful')
            }else{ 
                console.log(err.message) 
                res.send(err.message)
            }
        })
        client.end;
    })
    app.put('/updateUsers', (req, res)=> {
        let user = req.body;
        let updateQuery = `update users
                           set last_name = '${user.last_name}',
                           location = '${user.location}'
                           where id = ${user.id}`
    
        client.query(updateQuery, (err, result)=>{
            if(!err){
                res.send('Update was successful')
            }
            else{ console.log(err.message) }
        })
        client.end;
    })

    app.delete('/users/:id', (req, res)=> {
        let insertQuery = `delete from users where id=${req.params.id}`
    
        client.query(insertQuery, (err, result)=>{
            if(!err){
                res.send('Deletion was successful')
            }
            else{ console.log(err.message) }
        })
        client.end;
    })    
}
module.exports = {apiHandlerPG};