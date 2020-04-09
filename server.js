const path = require('path');
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const myLogic = require('./client/src/myLogic');

//heroku config
const port = process.env.PORT || 5000;

const app = express();

app.use(cors())

app.use(fileUpload());

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

//app.use('/download', express.static(__dirname));

//Upload Endpoint
app.post('/upload', (req, res) => {
    
    if (req.files === null) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const file = req.files.file;

    file.mv(`${__dirname}/uploads/${file.name}`, err => {
        
        if (err) {
            console.error(err);
            return res.status(500).send(err)
        }
        res.json({ fileName: file.name, filePath: `/uploads/${file.name}` });
    })
});

//este post para recibir el dato 
app.post('/dates', (req, res) => {
    const myDates = req.body.myDates;
    const filename = req.body.filename;
    myLogic.mySpecialFunction(myDates.initialDate, myDates.endDate, filename);
    myDates["loading"] = '';
    res.json(myDates)
    
})

app.get('/download', (req, res) => {
    const docPath = path.join(__dirname, 'Report.docx');
 
    res.download(docPath, 'Report.docx', function(err){
      if (err) {
        // if the file download fails, we throw an error
        throw err;
      }
    });
  })

app.listen(port, () => console.log( `Server Started...port ${port}`));