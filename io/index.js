const handleSocket = (socket) => {
    socket.on("LOGIN",(obj) => handleLogin(obj))
}
const handleLogin = async (obj) =>{
    console.log(obj)
}




module.exports = {handleSocket};