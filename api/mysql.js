const {dbConnection} = require('../connection')
const mkdirp = require('mkdirp');
const md5 = require('md5');
const QRCode = require('qrcode')
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const apiHandlerMysql = (app) => {

    app.post("/uploadPDF",function(req,res){
        if (req.files) {
            const file = req.files.fileUrl;
            const documentId = req.body.documentId;
            const made = mkdirp.sync('./files') 
            //061 0861 0033 00
            file.mv(`./files/${documentId}.pdf`, (err) => {
                if (err) {
                    res.send(false)
                }else{
                    res.send(true);
                }
            });
        }else{
            res.send(false)
        }
    });
    app.get("/signPDF/:documentId",function(req,res){
        const documentId = req.params.documentId
        console.log(documentId)
        addWaterMark(documentId,res)
    });
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