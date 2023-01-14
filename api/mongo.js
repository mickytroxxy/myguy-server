const mkdirp = require('mkdirp');
const md5 = require('md5');
const Post = require('../models/Post');
const apiHandler = (app) => {

    //Get all the posts
    app.get('/getPost', async (req, res) => {
        try {
            const posts = await Post.find().limit(5)
            res.json(posts)
        } catch (error) {
            res.json({message:error})   
        }
    });


    //Get a specific post
    app.get('/getPost/:postId', async (req, res) => {
        try {
            const post = await Post.findById(req.params.postId)
            res.json(post)
        } catch (error) {
            res.json({message:error})   
        }
    });

    //Delete a specific post
    app.delete('/deletePost/:postId', async (req, res) => {
        try {
            const removedPost = await Post.remove({_id:req.params.postId})
            res.json(removedPost)
        } catch (error) {
            res.json({message:error})   
        }
    });


    //Update a specific post
    app.patch('/patchPost/:postId/:description', async (req, res) => {
        try {
            const patchedPost = await Post.updateOne({_id:req.params.postId},{ $set : { description:req.params.description}})
            res.json(patchedPost)
        } catch (error) {
            res.json({message:error})   
        }
    });


    //Submit a post
    app.post('/posts', async (req, res) => {
        try {
            const response = await new Post(req.body).save();
            res.json(response)
        } catch (error) {
            res.json({message:error})   
        }
    });



    //Upload A File
    app.post("/uploadFile",function(req,res){
        if (req.files) {
            const file=req.files.fileUrl;
            const filePath=req.body.filePath;
            mkdirp(filePath,  (err) => {
                if (err){
                    console.error(err)
                    res.send(false)
                }else{
                    file.mv("./"+filePath,function(err){
                        if (err) {
                            console.log(err);
                        }else{
                            res.send(true);
                        }
                    });
                }
            });
        }
    });

    app.post("/uploadFile",function(req,res){
        if (req.files) {
            const file = req.files.fileUrl;
            const filePath = req.body.filePath;
            mkdirp(filePath,  (err) => {
                if (!err){
                    file.mv(`./${filePath}`, (err) => {
                        if (err) {
                            res.send(false)
                        }else{
                            res.send(true);
                        }
                    });
                }else{
                    res.send({message:'Could not create a directory'})
                }
            });
        }else{
            res.send(false)
        }
    });
}
module.exports = {apiHandler};