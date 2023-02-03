const mkdirp = require('mkdirp');
const QRCode = require('qrcode')
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const Rekognition = require('node-rekognition');
const {createData,updateData, getDocumentById, getUserInfo, sendPushNotification} = require("./api")
const AWSParameters = {
    "accessKeyId": "AKIAVAEKHGXRZOOPTFEP",
    "secretAccessKey": "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",
    "region": "ap-southeast-2",
}
const requests = [];
const rekognition = new Rekognition(AWSParameters);
const responseToClient = (requestId,obj) => {
    if(requests.length > 0){
        const requestInfo = requests.filter(item => item.requestId === requestId);
        if(requestInfo.length > 0){
            requestInfo[0].res.send(obj);
            requestInfo.splice(requestInfo.indexOf(requestInfo[0]), 1)
        }
    }
}
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
                        detectFaces(documentId,(cb) => {
                            if(cb){
                                if(fileCategory === "documentPhoto"){
                                    res.send({status:1,message:'Face detected, now comparing, please wait...'})   
                                }else{
                                    recogizeFaces(documentId,(cb) => {
                                        if(cb){
                                            res.send({status:1,similarity:cb})
                                        }else{
                                            res.send({status:0,message:"Identity check failed! Something Went Wrong"})
                                        }
                                    })
                                }
                            }else{
                                if(fileCategory === "documentPhoto"){
                                    res.send({status:0,message:'No face identified, scroll to where your face is!'})
                                }else{
                                    res.send({status:0,message:'No face available, try to move your camera'})
                                }
                            }
                        });
                    }
                }
            });
        }else{
            res.send(false)
        }
    });
    app.post("/verifyRequest",function(req,res){
        if (req.files) {
            const file = req.files.fileUrl;
            const selfiePhoto = req.body.documentId+"_selfiePhoto";
            const documentId = req.body.documentId
            const requestId = req.body.requestId;
            const filePath = `./files/${selfiePhoto}.png`;
            file.mv(filePath, (err) => {
                if (err) {
                    res.send({status:0,message:'Failed to upload your file'})
                }else{
                    detectFaces(selfiePhoto,(cb) => {
                        if(cb){
                            detectFaces(documentId,(cb) => {
                                if(cb){
                                    recogizeFaces(selfiePhoto,(cb) => {
                                        if(cb){
                                            responseToClient(requestId,{status:1,message:"SUCCESS"});
                                            res.send({status:1,similarity:cb,message:'Your verification was successful and access to your document has been granted'});
                                            updateData("verificationRequests",requestId,{status:"SUCCESS"});
                                        }else{
                                            responseToClient(requestId,{status:0,message:"NOTAMATCH"});
                                            res.send({status:0,message:"Identity check failed! Something Went Wrong"});
                                            updateData("verificationRequests",requestId,{status:"NOTAMATCH"});
                                        }
                                    })
                                }else{
                                    res.send({status:0,message:'No face identified, scroll to where your face is!'})
                                    updateData("verificationRequests",requestId,{status:"NOFACE"});
                                    responseToClient(requestId,{status:0,message:"NOFACE"});
                                }
                            })
                        }else{
                            res.send({status:0,message:'No face available, try to move your camera'});
                            updateData("verificationRequests",requestId,{status:"NOFACE"});
                            responseToClient(requestId,{status:0,message:"NOFACE"});
                            
                        }
                    });
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
    app.get("/denyRequest/:requestId",function(req,res){
        const requestId = req.params.requestId;
        console.log("The request is "+requestId)
        updateData("verificationRequests",requestId,{status:"DENIED"});
        responseToClient(requestId,{status:0,message:"USER HAS DENIED YOUR REQUEST"});
        res.send(true);
    });
    app.post("/verifyUser",function(req,res){
        const time = Date.now();
        const companyId = req.body.companyId;
        const companyName = req.body.companyName;
        const documentId = req.body.documentId;
        const status = "PENDING";
        const text = `${companyName} would like to access your personal data, Please approve with your face if you have authorized this act`;
        const requestId = (time + Math.floor(Math.random()*89999+10000000)).toString();
        getDocumentById(documentId,(response) => {
            console.log(response)
            if(response.length > 0){
                const accountId = response[0].documentOwner;
                getUserInfo(accountId,(response) => {
                    if(response.length > 0){
                        const user = response[0];
                        if(user.detectorMode){
                            requests.push({requestId,res});
                            sendPushNotification(user.notificationToken,`${companyName} Would like you to verify your identity`);
                            createData("verificationRequests",requestId,{time,companyId,accountId,text,status,documentId,requestId},companyName);
                            setTimeout(() => {
                                const requestInfo = requests.filter(item => item.requestId === requestId);
                                if(requestInfo.length > 0){
                                    res.send({success:0,message:"REQUEST TIME OUT"})
                                }
                            }, 120000);
                        }else{
                            res.send({success:0,message:"USER HAS DISABLED CYBER DETECTOR MODE"})
                        }
                    }else{
                        res.send({success:0,message:"NO SUCH USER ON OUR SERVERS"})
                    }
                })
            }else{
                res.send({success:0,message:"NO SUCH USER ON OUR SERVERS"})
            }
        })
    });
    app.get("/api",function(req,res){
        res.send({data:"success"})
        console.log(createData("someTest","7377778",{name:'Mickyyyyy'}))
    });
}
const detectFaces = async (documentId,cb) =>{
    const bitmap = fs.readFileSync('./files/'+documentId+'.png')
    const imageFaces = await rekognition.detectFaces(bitmap)
    if(imageFaces?.FaceDetails?.length > 0){
        cb(true);
    }else{
        cb(false)
    }
}
const recogizeFaces = async (documentId,cb) =>{
    const selfiePhoto = fs.readFileSync('./files/'+documentId+'.png')
    const documentPhoto = fs.readFileSync('./files/'+documentId.split("_")[0]+'.png')
    const imageFaces = await rekognition.compareFaces(selfiePhoto,documentPhoto);
    if(imageFaces){
        if(imageFaces.FaceMatches?.length > 0){
            if(imageFaces.FaceMatches[0]?.Similarity > 74){
                cb(imageFaces.FaceMatches[0]?.Similarity)            
            }else{
                cb(false)
            }
        }else{
            cb(false)
        }
    }else{
        cb(false)
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
        console.log("Document Signed")
        res.send(true);
    })
}
module.exports = {apiHandlerMysql};