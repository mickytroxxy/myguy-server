const { createData } = require("../context/firebase");

const auth = (app) => {
    app.post("/register",function(req,res){
        const {obj} = req.body;
        const {id} = obj;
        createData("clients",id,obj)
    })
}
module.exports = {auth};