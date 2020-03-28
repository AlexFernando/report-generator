const path = require('path');
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
//const myLogic = require('./client/src/myLogic');

//import path from 'path';
//import express from 'express';
//import cors from 'cors';
//import fileUpload from 'express-fileupload';

const app = express();

app.use(cors())

app.use(fileUpload());

//app.use('/download', express.static(__dirname));

//Upload Endpoint
app.post('/upload', (req, res) => {
    
    if (req.files === null) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const file = req.files.file;

    file.mv(`${__dirname}/client/public/uploads/${file.name}`, err => {
        
        if (err) {
            console.error(err);
            return res.status(500).send(err)
        }
        res.json({ fileName: file.name, filePath: `/uploads/${file.name}` });
        
    })
});

//este post para recibir el dato 
app.post('/dates', (req, res) => {
    const myDates = req.files;
    console.log(myDates);
})

app.get('/download', (req, res) => {
    console.log("descarga")
    const docPath = path.join(__dirname, 'exampleSeptiembre.docx');
 
    res.download(docPath, 'exampleSeptiembre.docx', function(err){
      if (err) {
        // if the file download fails, we throw an error
        throw err;
      }
      console.log('Someone just downloaded our file!');
    });
  })

app.listen(5000, () => console.log('Server Started...'));