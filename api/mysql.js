const mkdirp = require('mkdirp');
const QRCode = require('qrcode')
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const Rekognition = require('node-rekognition');
const path = require('path');
const AWSParameters = {
    "accessKeyId": "AKIAVAEKHGXRZOOPTFEP",
    "secretAccessKey": "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",
    "region": "ap-southeast-2",
}
const rekognition = new Rekognition(AWSParameters)
const apiHandlerMysql = (app) => {
    app.post("/uploadPDF",function(req,res){
        if (req.files) {
            const file = req.files.fileUrl;
            const documentId = req.body.documentId;
            const fileCategory = req.body.fileCategory;
            console.log("uploading ",fileCategory)
            const made = mkdirp.sync('./files');
            const filePath = fileCategory === `document` ? `./files/${documentId}.pdf` : `./files/${documentId}.png`
            file.mv(filePath, (err) => {
                if (err) {
                    res.send({status:0,message:'Failed to upload your file'})
                }else{
                    if(fileCategory === 'document'){
                        res.send({status:1,message:'Document Successfully uploaded!'})
                    }else{
                        detectFaces(documentId,fileCategory,res);
                    }
                }
            });
        }else{
            res.send(false)
        }
    });
    app.get("/signPDF/:documentId",function(req,res){
        const documentId = req.params.documentId
        addWaterMark(documentId,res)
    });
    app.get("/api",function(req,res){
        res.send({data:"success"})
    });
}
const detectFaces = async (documentId,fileCategory,res) =>{
    const bitmap = fs.readFileSync('./files/'+documentId+'.png')
    const imageFaces = await rekognition.detectFaces(bitmap)
    if(imageFaces?.FaceDetails?.length > 0){
        if(fileCategory === "documentPhoto"){
            res.send({status:1,message:'Face detected, now comparing, please wait...'})   
        }else{
            recogizeFaces(documentId,fileCategory,res)
        }
    }else{
        if(fileCategory === "documentPhoto"){
            res.send({status:0,message:'No face identified, scroll to where your face is!'})
        }else{
            res.send({status:0,message:'No face available, try to move your camera'})
        }
    }
}
const recogizeFaces = async (documentId,fileCategory,res) =>{
    const selfiePhoto = fs.readFileSync('./files/'+documentId+'.png')
    const documentPhoto = fs.readFileSync('./files/'+documentId.split("_")[0]+'.png')
    const imageFaces = await rekognition.compareFaces(selfiePhoto,documentPhoto);
    if(imageFaces){
        if(imageFaces.FaceMatches?.length > 0){
            res.send({status:1,similarity:imageFaces.FaceMatches[0]?.Similarity})
        }else{
            res.send({status:1,similarity:0})
        }
    }else{
        res.send({status:0,message:"Something went wrong while trying to verify your identity!"})
    }
}
const addWaterMark = async (documentId,res) => {
    const opts = {
        errorCorrectionLevel: 'H',
        quality: 1,
        margin: 2,
        width:50,
        color: {
            dark: '#000',
            light: '#fff',
        },
    }
    QRCode.toDataURL(documentId, opts, async (err,url)=>{
        const doc = await PDFDocument.load(fs.readFileSync('./files/'+documentId+'.pdf'));
        const pages = doc.getPages();
        const img = await doc.embedPng(url);
        for (const [i, page] of Object.entries(pages)) {
            page.drawImage(img, {
                x: page.getWidth() - 60,
                y: page.getHeight() - (page.getHeight() - 10)
            });
        }
        fs.writeFileSync('./files/'+documentId+'.pdf', await doc.save());
        res.send(true);
    })
}
module.exports = {apiHandlerMysql};