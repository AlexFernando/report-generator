
const csv = require('csv-parser');
const fs = require('fs')
const officegen = require('officegen');


/*import csv from 'csv-parser';
import fs from 'fs';
import officegen from 'officegen';
import DateForm from './components/DateForm';*/


//passing dates 
//let myDates = DateForm.name;


function mySpecialFunction(myName) {


let results = []; //to save data after reading the file
let filteredData = []; // data ready to write on the file 
let excelData = require('./excelParserFilter')
let excelComments = require('./excelComments')

let familyData = excelData.familyResults();

let commentsData = excelComments.commentsResults();

let regExp = /\(([^)]+)\)/;


for (let i = 0; i < commentsData.length; i++) {
    for (let propName in commentsData[i]) {
        if (commentsData[i][propName] === '') {
            delete commentsData[i][propName];
        }
    }
}

//Object.keys(elem).forEach(key => (elem[key] === null) && delete elem[key])

function filterData(results) {

    let count = 0;

    for (let i in results) {
        let obj = results[i];
        let date = results[i]['Date'];
        let date1 = '2019-11-04'; // parameters to filter (dates)
        let date2 = '2019-11-22';
        //saving complete objects
        if (date >= date1 && date <= date2) {
            count++;
            filteredData.push(obj);
        }
    }
    //take only some properties of the object to write to .docx

    // Create an empty Word object:
    let docx = officegen('docx')

    // Officegen calling this function after finishing to generate the docx document:
    docx.on('finalize', function(written) {
        console.log(
            'Finish to create a Microsoft Word document.'
        )
    })

    // Officegen calling this function to report errors:
    docx.on('error', function(err) {
        console.log(err)
    })

    let objectFormat = {};
    let oldTestVar = '';
    let cleanKeys = [];
    let deleteDuplicates = [];
    let matchArray = [];
    let myArrayOfGroups = [];
    let arrayOfPoppedElem = [];
    let arrayOfFinalGroups = [];
    let matchComments = [];

    filteredData.map(elem => {

        //To put * in Location 
        if (elem['Observation Details'] === undefined) {
            elem['Location'] += '';
            elem['Location'].trim();
        } else if (elem['Observation Details'].trim() === 'Heard(s).') {
            elem['Location'] = "*";
        } else {
            elem['Location'] += '';
            elem['Location'].trim();
        }

        //clean the objects to keep just some keys values
        const allowed = ['Common Name', 'Scientific Name', 'Location', 'Observation Details'];

        const filtered = Object.keys(elem)
            .filter(key => allowed.includes(key))
            .reduce((obj, key) => {
                return {
                    ...obj,
                    [key]: elem[key]
                };
            }, {});
        //add into an array 
        cleanKeys.push(filtered)
    })

    //delete some duplicate keys
    deleteDuplicates = cleanKeys.reduce((accumulator, curr) => {

        let name = curr['Common Name'],
            found = accumulator.find(elem => elem['Common Name'] === name)

        if (found) found.Location += ';' + curr.Location;
        else accumulator.push(curr);
        return accumulator;
    }, []);

    let size = Object.keys(deleteDuplicates).length;
    console.log(size);


    //delete repeated locations
    deleteDuplicates.map(elem => {

        let myLocation = elem['Location'];

        //converting a string into array for Location
        myLocation = elem['Location'].split(';');

        //
        myLocation = myLocation.filter((item, index) => {
            return myLocation.indexOf(item) === index;
        })

        if (myLocation.length === 1 && myLocation[0] === '*') {
            elem['Scientific Name'] += '*';
            myLocation.unshift('');
            elem['Location'] = myLocation[0];
        } else if (myLocation.length > 1 && myLocation.indexOf('*') > -1) {
            let index = myLocation.indexOf('*');
            if (index > -1) {
                myLocation.splice(index, 1);
            }
            elem['Location'] = `Seen at: ${myLocation.join(', ')}.`;
        } else {
            elem['Location'] = `Seen at: ${myLocation.join(', ')}.`;
        }
        //match identical elements between both databases base on the Enlgish and Common name
        let nameMatch = familyData.find(el => el['English name'] === elem['Common Name']);

        //all items that must to have comments
        matchComments = commentsData.find(myElem => myElem['EnglishName'] === elem['Common Name'])


        if (matchComments) {
            //console.log(matchComments);
            elem = {...elem, ...matchComments }
        }

        let familyText = '';

        //creating the final array with the family name
        if (nameMatch) {
            familyText = nameMatch.family;

            if (familyText === '') {
                familyText = '(Others)';
            }
            //finding a match between my array of objects and the familyDataBase 
            let myArrayFamily = regExp.exec(familyText);

            if (myArrayFamily !== null) {
                let testFamilyName = myArrayFamily[1];

                let realFamilyName = testFamilyName.toUpperCase();

                if (oldTestVar !== testFamilyName) {
                    oldTestVar = testFamilyName;

                    //adding the family name with uppercase letters
                    objectFormat[realFamilyName] = new Array();
                }
                objectFormat[realFamilyName].push(elem)
            }

        }
    })


    //matching only species with the content of only Peru  but not others countries or locations outside Peru
    familyData.map(item => {
        let RegExp = /^(?!.*(and|to|Ecuador|Brazil|Bolivia|Argentina|Colombia|Paraguay|Venezuela|Chile|Uruguay|California)).*Peru.*$/

        let myMatch = RegExp.exec(item.range)

        let myScientificName = item['scientific name'];

        if (myMatch !== null) {
            matchArray.push(myScientificName)
        }
    })

    for (key in objectFormat) {

        value = objectFormat[key];

        for (let elem = 0; elem < value.length; elem++) {
            let scientificName = value[elem]['Scientific Name']

            let arrayScientificName = scientificName.split(' ');
            let popped = '';

            if (arrayScientificName.length >= 3) {
                popped = arrayScientificName.pop();

                arrayOfPoppedElem.push(popped);

                let myGroupSpecie = arrayScientificName.join(' ');

                myArrayOfGroups.push(myGroupSpecie);
            }
        }
    }

    //console.log("grupos: ", myArrayOfGroups);

    for (let i = 0; i < myArrayOfGroups.length - 1; i++) {
        if (myArrayOfGroups[i] === myArrayOfGroups[i + 1]) {
            arrayOfFinalGroups.push(myArrayOfGroups[i])
            arrayOfFinalGroups.push(myArrayOfGroups[i] + ' ' + arrayOfPoppedElem[i])
            arrayOfFinalGroups.push(myArrayOfGroups[i + 1] + ' ' + arrayOfPoppedElem[i + 1])
        }
    }

    let numIndex = 0;
    let subIndex = 0;

    for (key in objectFormat) {
        let familyName = key;
        pObj = docx.createP()
        pObj.addText(familyName, { bold: true, color: '188c18', font_face: 'Calibri', font_size: 16 })
        pObj.addLineBreak()
        value = objectFormat[key];

        for (let elem = 0; elem < value.length; elem++) {

            let commonName = value[elem]['Common Name'];
            let scientificName = value[elem]['Scientific Name'];
            let locationDetails = value[elem]['Location'];
            let rangeRestrictedSpecies = '';
            let peruvianEndemic = '';
            let vulnerable = '';
            let lightPurple = '';
            let blue = '';
            let lightBlue = '';
            let red = '';
            let blueTwo = '';
            let lightBlueTwo = '';
            let redTwo = '';
            let darkPurple = '';
            let lightPurpleTwo = '';
            let darkPurpleTwo = '';
            let blackComments = '';
            let grayComments = '';
            let cursivaComments = '';
            let cursivaBoldComments = '';
            let boldWordsComments = '';
            let blackGroup = '';
            let lightBlueGroup = '';
            let redGroup = '';
            let lightPurpleGroup = '';
            let blackGroup2 = '';
            let lightBlueGroup2 = '';
            let redGroup2 = '';
            let commentsGroup = '';
            let blueThree = '';
            let redThree = '';
            let lightPurpleThree  = '';
            let darkPurpleThree = '';
            let separatorSymbol = '';

           
            /*comment functions Start*/

            const addComments = () => {

                if(value[elem]['light_purple'] || value[elem]['blue'] || value[elem]['light_blue'] ||value[elem]['red'] || value[elem]['blue_2'] || value[elem]['light_blue_2'] || value[elem]['red_2'] || value[elem]['dark_purple'] || value[elem]['light_purple_2'] || value[elem]['dark_purple_2']){
                    pObj.addLineBreak();
                    pObj.addLineBreak();    
                }

                if (value[elem]['light_purple']) {
                    
                    lightPurple = value[elem]['light_purple'];
                    //pObj.addText(lightPurple, { color: 'CC00CC', font_face: 'Calibri', font_size: 12 });
                    if(lightPurple.substring(lightPurple.length - 1) === '/'){
                        separatorSymbol = lightPurple.substring(lightPurple.length - 1);
                        lightPurple = lightPurple.slice(0,-1);
                        pObj.addText(lightPurple, { color: 'CC00CC', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(separatorSymbol, {font_face: 'Calibri', font_size: 12 });
                    }

                    else if(lightPurple.substring(lightPurple.length - 1) === '|') {
                        separatorSymbol = lightPurple.substring(lightPurple.length - 1);
                        lightPurple = lightPurple.slice(0,-1);
                        pObj.addText(lightPurple, { color: 'CC00CC', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(' ' + separatorSymbol + ' ', {font_face: 'Calibri', font_size: 12 });
                    }

                    else {
                        pObj.addText(lightPurple, { color: 'CC00CC', font_face: 'Calibri', font_size: 12 });
                    }
                }
                
                if (value[elem]['blue']) {
                    
                    blue = value[elem]['blue'];
                    //pObj.addText(blue, { color: '366091', font_face: 'Calibri', font_size: 12 });

                    if(blue.substring(blue.length - 1) === '/'){
                        separatorSymbol = blue.substring(blue.length - 1);
                        blue = blue.slice(0,-1);
                        pObj.addText(blue, { color: '366091', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(separatorSymbol, {font_face: 'Calibri', font_size: 12 });
                    }

                    else if(blue.substring(blue.length - 1) === '|') {
                        separatorSymbol = blue.substring(blue.length - 1);
                        blue = blue.slice(0,-1);
                        pObj.addText(blue, { color: '366091', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(' ' + separatorSymbol + ' ', {font_face: 'Calibri', font_size: 12 });
                    }

                    else {
                        pObj.addText(blue, { color: '366091', font_face: 'Calibri', font_size: 12 });
                    }
                }
                
                if (value[elem]['light_blue']) {
                    
                    lightBlue= value[elem]['light_blue'];
                    //pObj.addText(lightBlue, { color: '0070C0', font_face: 'Calibri', font_size: 12 });
                    if(lightBlue.substring(lightBlue.length - 1) === '/'){
                        separatorSymbol = lightBlue.substring(lightBlue.length - 1);
                        lightBlue = lightBlue.slice(0,-1);
                        pObj.addText(lightBlue, { color: '0070C0', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(separatorSymbol, {font_face: 'Calibri', font_size: 12 });
                    }

                    else if(lightBlue.substring(lightBlue.length - 1) === '|') {
                        separatorSymbol = lightBlue.substring(lightBlue.length - 1);
                        lightBlue = lightBlue.slice(0,-1);
                        pObj.addText(lightBlue, { color: '0070C0', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(' ' + separatorSymbol + ' ', {font_face: 'Calibri', font_size: 12 });
                    }

                    else {
                        pObj.addText(lightBlue, { color: '0070C0', font_face: 'Calibri', font_size: 12 });
                    }
                }
                
                if (value[elem]['red']) {
                    red = value[elem]['red'];
                    //pObj.addText(' ' + red + ' ', { color: 'ff0000', font_face: 'Calibri', font_size: 12 });
                    if(red.substring(red.length - 1) === '/'){
                        separatorSymbol = red.substring(red.length - 1);
                        red = red.slice(0,-1);
                        pObj.addText(red, { color: 'ff0000', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(separatorSymbol, {font_face: 'Calibri', font_size: 12 });
                    }

                    else if(red.substring(red.length - 1) === '|') {
                        separatorSymbol = red.substring(red.length - 1);
                        red = red.slice(0,-1);
                        pObj.addText(red, { color: 'ff0000', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(' ' + separatorSymbol + ' ', {font_face: 'Calibri', font_size: 12 });
                    }

                    else {
                        pObj.addText(red, { color: 'ff0000', font_face: 'Calibri', font_size: 12 });
                    }
                }
                
                if (value[elem]['blue_2']) {
                    blueTwo = value[elem]['blue_2'];
                    //pObj.addText(blueTwo, { color: '366091', font_face: 'Calibri', font_size: 12 })
                    if(blueTwo.substring(blueTwo.length - 1) === '/'){
                        separatorSymbol = blueTwo.substring(blueTwo.length - 1);
                        blueTwo = blueTwo.slice(0,-1);
                        pObj.addText(blueTwo, { color: '366091', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(separatorSymbol, {font_face: 'Calibri', font_size: 12 });
                    }

                    else if(blueTwo.substring(blueTwo.length - 1) === '|') {
                        separatorSymbol = blueTwo.substring(blueTwo.length - 1);
                        blueTwo = blueTwo.slice(0,-1);
                        pObj.addText(blueTwo, { color: '366091', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(' ' + separatorSymbol + ' ', {font_face: 'Calibri', font_size: 12 });
                    }

                    else {
                        pObj.addText(blueTwo, { color: '366091', font_face: 'Calibri', font_size: 12 });
                    }
                }
                
                if (value[elem]['light_blue_2']) {
                    lightBlueTwo = value[elem]['light_blue_2']
                    //pObj.addText(lightBlueTwo, { color: '0070C0', font_face: 'Calibri', font_size: 12 })
                    if(lightBlueTwo.substring(lightBlueTwo.length - 1) === '/'){
                        separatorSymbol = lightBlueTwo.substring(lightBlueTwo.length - 1);
                        lightBlueTwo = lightBlueTwo.slice(0,-1);
                        pObj.addText(lightBlueTwo, { color: '0070C0', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(separatorSymbol, {font_face: 'Calibri', font_size: 12 });
                    }

                    else if(lightBlueTwo.substring(lightBlueTwo.length - 1) === '|') {
                        separatorSymbol = lightBlueTwo.substring(lightBlueTwo.length - 1);
                        lightBlueTwo = lightBlueTwo.slice(0,-1);
                        pObj.addText(lightBlueTwo, { color: '0070C0', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(' ' + separatorSymbol + ' ', {font_face: 'Calibri', font_size: 12 });
                    }

                    else {
                        pObj.addText(lightBlueTwo, { color: '0070C0', font_face: 'Calibri', font_size: 12 });
                    }
                }
                
                if (value[elem]['red_2']) {
                    redTwo = value[elem]['red_2']
                    //pObj.addText(' ' + redTwo + ' ', { color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    if(redTwo.substring(redTwo.length - 1) === '/'){
                        separatorSymbol = redTwo.substring(redTwo.length - 1);
                        redTwo = redTwo.slice(0,-1);
                        pObj.addText(redTwo, { color: 'ff0000', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(separatorSymbol, {font_face: 'Calibri', font_size: 12 });
                    }

                    else if(redTwo.substring(redTwo.length - 1) === '|') {
                        separatorSymbol = redTwo.substring(redTwo.length - 1);
                        redTwo = redTwo.slice(0,-1);
                        pObj.addText(redTwo, { color: 'ff0000', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(' ' + separatorSymbol + ' ', {font_face: 'Calibri', font_size: 12 });
                    }

                    else {
                        pObj.addText(redTwo, { color: 'ff0000', font_face: 'Calibri', font_size: 12 });
                    }
                }
                
                if (value[elem]['dark_purple']) {
                  
                    darkPurple = value[elem]['dark_purple'];
                    //pObj.addText(' ' + darkPurple, { color: '800080', font_face: 'Calibri', font_size: 12 });
                    if(darkPurple.substring(darkPurple.length - 1) === '/'){
                        separatorSymbol = darkPurple.substring(darkPurple.length - 1);
                        darkPurple = darkPurple.slice(0,-1);
                        pObj.addText(darkPurple, { color: '800080', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(separatorSymbol, {font_face: 'Calibri', font_size: 12 });
                    }

                    else if(darkPurple.substring(darkPurple.length - 1) === '|') {
                        separatorSymbol = darkPurple.substring(darkPurple.length - 1);
                        darkPurple = darkPurple.slice(0,-1);
                        pObj.addText(darkPurple, { color: '800080', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(' ' + separatorSymbol + ' ', {font_face: 'Calibri', font_size: 12 });
                    }

                    else {
                        pObj.addText(darkPurple, { color: '800080', font_face: 'Calibri', font_size: 12 });
                    }
                }
                
                if (value[elem]['light_purple_2']) {
                  
                    lightPurpleTwo = value[elem]['light_purple_2']
                    //pObj.addText(' ' + lightPurpleTwo, { bold: true, color: 'CC00CC', font_face: 'Calibri', font_size: 12 })
                    if(lightPurpleTwo.substring(lightPurpleTwo.length - 1) === '/'){
                        separatorSymbol = lightPurpleTwo.substring(lightPurpleTwo.length - 1);
                        lightPurpleTwo = lightPurpleTwo.slice(0,-1);
                        pObj.addText(lightPurpleTwo, { color: 'CC00CC', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(separatorSymbol, {font_face: 'Calibri', font_size: 12 });
                    }

                    else if(lightPurpleTwo.substring(lightPurpleTwo.length - 1) === '|') {
                        separatorSymbol = lightPurpleTwo.substring(lightPurpleTwo.length - 1);
                        lightPurpleTwo = lightPurpleTwo.slice(0,-1);
                        pObj.addText(lightPurpleTwo, { color: 'CC00CC', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(' ' + separatorSymbol + ' ', {font_face: 'Calibri', font_size: 12 });
                    }

                    else {
                        pObj.addText(lightPurpleTwo, { color: 'CC00CC', font_face: 'Calibri', font_size: 12 });
                    }
                }
                
                if (value[elem]['dark_purple_2']) {
                    
                    darkPurpleTwo = value[elem]['dark_purple_2'];
                    //pObj.addText(' ' + darkPurpleTwo, { color: '800080', font_face: 'Calibri', font_size: 12 });
                    if(darkPurpleTwo.substring(darkPurpleTwo.length - 1) === '/'){
                        separatorSymbol = darkPurpleTwo.substring(darkPurpleTwo.length - 1);
                        darkPurpleTwo = darkPurpleTwo.slice(0,-1);
                        pObj.addText(darkPurpleTwo, { color: '800080', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(separatorSymbol, {font_face: 'Calibri', font_size: 12 });
                    }

                    else if(darkPurpleTwo.substring(darkPurpleTwo.length - 1) === '|') {
                        separatorSymbol = darkPurpleTwo.substring(darkPurpleTwo.length - 1);
                        darkPurpleTwo = darkPurpleTwo.slice(0,-1);
                        pObj.addText(darkPurpleTwo, { color: '800080', font_face: 'Calibri', font_size: 12 });
                        pObj.addText(' ' + separatorSymbol + ' ', {font_face: 'Calibri', font_size: 12 });
                    }

                    else {
                        pObj.addText(darkPurpleTwo, { color: '800080', font_face: 'Calibri', font_size: 12 });
                    }
                }
            }

            const addBlackComments = () => {
                
                let iBold = 0;
                let iBoldItalics = 0;
                let indexItalics = 0;
                let indexGray

                if (value[elem]['black_comment']){

                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    blackComments = value[elem]['black_comment'];
                    let arrayOfBlackComments = blackComments.split(' ');

                    let arrayOfIndexGrayComments = [];
                    let arrayOfStringsGrayComments = [];

                    if(value[elem]['gray_comment']){

                        grayComments = value[elem]['gray_comment'];
                        arrayOfStringsGrayComments = cursivaComments.split('-');

                        //console.log("array de palabras en gris ",arrayOfStringsGrayComments);

                        for(let i = 0; i < arrayOfStringsGrayComments.length; i++){
                            if(arrayOfBlackComments.indexOf(arrayOfStringsGrayComments[i]) > -1) {
                                arrayOfIndexGrayComments.push(arrayOfBlackComments.indexOf(arrayOfStringsGrayComments[i]))
                                arrayOfBlackComments[arrayOfBlackComments.indexOf(arrayOfStringsGrayComments[i])] = "*inBold*";
                            }
                        }
                    }

                    let arrayOfIndexItalics = [];
                    let arrayOfStringsItalics = [];

                    if(value[elem]['cursiva']){
                        cursivaComments = value[elem]['cursiva'];
                        arrayOfStringsItalics = cursivaComments.split('-');


                        if(arrayOfBlackComments[0] === 'The') {
                            console.log("array of black comments", arrayOfBlackComments.splice(40, arrayOfBlackComments.length));
                        }
                       
                        //console.log("array de palabras en cursiva: ",arrayOfStringsItalics);

                        for(let i = 0; i < arrayOfStringsItalics.length; i++){
                            if(arrayOfBlackComments.indexOf(arrayOfStringsItalics[i]) > -1) {
                                arrayOfIndexItalics.push(arrayOfBlackComments.indexOf(arrayOfStringsItalics[i]))
                                arrayOfBlackComments[arrayOfBlackComments.indexOf(arrayOfStringsItalics[i])] = "*inBold*";
                            }
                        }
                    }

                    let arrayOfIndexItalicsBold = [];
                    let arrayOfStringsCursivaBold = [];
                
                    if(value[elem]['cm_cursiva_bold']){
                        cursivaBoldComments = value[elem]['cm_cursiva_bold'];
                        arrayOfStringsCursivaBold = cursivaBoldComments.split('-');

                        //console.log("array de palabras en negrita y cursiva: ",arrayOfStringsCursivaBold)
                        
                        for(let i = 0; i < arrayOfStringsCursivaBold.length; i++){
                            if(arrayOfBlackComments.indexOf(arrayOfStringsCursivaBold[i]) > -1) {
                                arrayOfIndexItalicsBold.push(arrayOfBlackComments.indexOf(arrayOfStringsCursivaBold[i]))
                                arrayOfBlackComments[arrayOfBlackComments.indexOf(arrayOfStringsCursivaBold[i])] = "*inBold*";
                            }
                        }
                    }

                    let arrayOfIndexBoldWords = [];
                    let arrayOfStringsBold = [];

                    if(value[elem]['comments_bold_words']){
                        boldWordsComments = value[elem]['comments_bold_words'];
                        arrayOfStringsBold = boldWordsComments.split('-');
                        
                        //console.log("array de palabras en negrita: ",arrayOfStringsBold)
                        //console.log("array of black comments", arrayOfBlackComments);
                        for(let i = 0; i < arrayOfStringsBold.length; i++){
                            if(arrayOfBlackComments.indexOf(arrayOfStringsBold[i]) > -1) {
                                arrayOfIndexBoldWords.push(arrayOfBlackComments.indexOf(arrayOfStringsBold[i]))
                                arrayOfBlackComments[arrayOfBlackComments.indexOf(arrayOfStringsBold[i])] = "*inBold*";
                            }
                        }
                    }

                    //console.log("indexBold: ",arrayOfIndexBoldWords);
                    //console.log("indexBoldItalics: ",arrayOfIndexItalicsBold);
                    for(let j = 0; j < arrayOfBlackComments.length; j++){
                        if(arrayOfIndexBoldWords.includes(j)){ 
                            //console.log(arrayOfBlackComments[j])
                            pObj.addText(arrayOfStringsBold[iBold] + ' ', {bold: true, font_face: 'Calibri', font_size: 12 });
                            //console.log("j: ", j)
                            iBold++;
                        }

                        else if (arrayOfIndexItalicsBold.includes(j)) {    
                            pObj.addText(arrayOfStringsCursivaBold[iBoldItalics] + ' ', {bold: true, italic: true, font_face: 'Calibri', font_size: 12 });
                            //console.log("j: ", j)
                            iBoldItalics++;
                        }

                        else if (arrayOfIndexItalics.includes(j)) {
                            //console.log(arrayOfBlackComments[j])
                            pObj.addText(arrayOfStringsItalics[indexItalics] + ' ', {italic: true, font_face: 'Calibri', font_size: 12 });
                            //console.log("j: ", j)
                            indexItalics++;
                        }

                        else if (arrayOfIndexGrayComments.includes(j)) {
                            pObj.addText(arrayOfStringsGrayComments[indexGray] + ' ', {color:'5F5F5F' ,font_face: 'Calibri', font_size: 12 });
                            //console.log("j: ", j)
                            indexGray++;
                        }

                        else{
                            pObj.addText(arrayOfBlackComments[j] + ' ', {font_face: 'Calibri', font_size: 12 });    
                        }   
                        
                    }
                }
               
            }

            const addCommentsGroup = () => {
                
                if (value[elem]['black_group']){
                    blackGroup = value[elem]['black_group'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(blackGroup, {font_face: 'Calibri', font_size: 12 });
                }

                if (value[elem]['light_blue_group']){
                    lightBlueGroup = value[elem]['light_blue_group'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(lightBlueGroup, {color: '0070C0', font_face: 'Calibri', font_size: 12 });
                }

                if (value[elem]['red_group']){
                    redGroup = value[elem]['red_group'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(redGroup, {color: 'ff0000' , font_face: 'Calibri', font_size: 12 });
                }

                if (value[elem]['light_purple_group']){
                    lightPurpleGroup = value[elem]['light_purple_group'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(lightPurpleGroup, {color:'CC00CC', font_face: 'Calibri', font_size: 12 });
                }

                if (value[elem]['black_group2']){
                    blackGroup2 = value[elem]['black_group2'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(blackGroup2, {font_face: 'Calibri', font_size: 12 });
                }

                if (value[elem]['light_blue_group2']){
                    lightBlueGroup2 = value[elem]['light_blue_group2'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(lightBlueGroup2, {color:'0070C0', font_face: 'Calibri', font_size: 12 });
                }

                if (value[elem]['red_group2']){
                    redGroup2 = value[elem]['red_group2'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(redGroup2, { color: 'ff0000', font_face: 'Calibri', font_size: 12 });
                }

                if (value[elem]['comments_group']){
                    commentsGroup = value[elem]['comments_group'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(commentsGroup, {font_face: 'Calibri', font_size: 12 });
                }

                if (value[elem]['blue_3']){
                    blueThree = value[elem]['blue_3'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(blueThree, {color: '0070C0', font_face: 'Calibri', font_size: 12 });
                }
                
                if (value[elem]['red_3']){
                    redThree = value[elem]['red_3'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(redThree, {color: 'ff0000', font_face: 'Calibri', font_size: 12 });
                }

                if (value[elem]['light_purple_three']){
                    lightPurpleThree = value[elem]['light_purple_three'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(lightPurpleThree, {color: 'CC00CC', font_face: 'Calibri', font_size: 12 });
                }

                if (value[elem]['dark_purple_three']){
                    darkPurpleThree = value[elem]['dark_purple_three'];
                    pObj.addLineBreak();
                    pObj.addLineBreak();
                    pObj.addText(darkPurpleThree, {color: '800080', font_face: 'Calibri', font_size: 12 });
                }
            }

            /*comment functions ends*/
            numIndex++;

            if (arrayOfFinalGroups.includes(scientificName)) {

                let convertToArr = scientificName.split(' ');

                if (convertToArr.length === 2) {
                    pObj.addText(numIndex + '. ', { bold: true, font_face: 'Calibri', font_size: 12 })
                    //restricted species RR
                    if (value[elem]['Range restricted species']) {
                        rangeRestrictedSpecies = value[elem]['Range restricted species']
                        pObj.addText(rangeRestrictedSpecies + ' ', { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }

                    //Peruvian Endemic E
                    if (value[elem]['Peruvian Endemic'] || matchArray.includes(scientificName)) {
                        peruvianEndemic = value[elem]['Peruvian Endemic']
                        console.log("endemicos: ", scientificName)
                        pObj.addText('E ', { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }
                    
                    pObj.addText(commonName, { bold: true, font_face: 'Calibri', font_size: 12 })
                    pObj.addText(' (' + scientificName + ')', { bold: true, font_face: 'Calibri', font_size: 12 })
                    
                    //Endemic to Peru 
                    if(peruvianEndemic){
                        pObj.addText(' ' + peruvianEndemic, { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }

                    //Vulnerable (VU)
                    if (value[elem]['Vulnerable']) {
                        vulnerable = value[elem]['Vulnerable']
                        pObj.addText(' ' + vulnerable, { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }
                    // here the function
                    
                    addComments();

                    addBlackComments();

                    addCommentsGroup();
                    
                    pObj.addLineBreak();
                    pObj.addLineBreak();

                    //pObj.addText(vulnerable, { bold: true, color: 'cb3234', font_face: 'Calibri', font_size: 12 })
                } else {
                    subIndex++;
                    //restricted species RR
                    if (value[elem]['Range restricted species']) {
                        rangeRestrictedSpecies = value[elem]['Range restricted species']
                        pObj.addText(rangeRestrictedSpecies + ' ', { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }
                    //Peruvian Endemic E
                    if (value[elem]['Peruvian Endemic'] || matchArray.includes(scientificName)) {
                        peruvianEndemic = value[elem]['Peruvian Endemic']
                        console.log("endemicos: ", scientificName)
                        pObj.addText('E ', { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }
                    pObj.addText(numIndex + '.' + subIndex + ' ', { bold: true, font_face: 'Calibri', font_size: 12 })
                    pObj.addText('           ' + commonName + ' - ', { bold: true, font_face: 'Calibri', font_size: 12 })
                    pObj.addText(' (' + scientificName + ')', { bold: true, font_face: 'Calibri', font_size: 12 })
                    //Endemic to Peru 
                    if(peruvianEndemic){
                        pObj.addText(' ' + peruvianEndemic, { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }

                    //Vulnerable (VU)
                    if (value[elem]['Vulnerable']) {
                        vulnerable = value[elem]['Vulnerable']
                        pObj.addText(' ' + vulnerable, { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }
                    //here is the function
                    addComments();

                    addBlackComments();

                    addCommentsGroup();

                    pObj.addLineBreak()
                    pObj.addLineBreak()

                    pObj.addText('           ' + locationDetails, { font_face: 'Calibri', font_size: 12 })

                    pObj.addLineBreak()
                    pObj.addLineBreak()
                }
            } else {

                //pObj.addText(rangeRestrictedSpecies + ' ', { bold: true, color: 'cb3234', font_face: 'Calibri', font_size: 12 })
                pObj.addText(numIndex + '. ', { bold: true, font_face: 'Calibri', font_size: 12 })

                if (scientificName.charAt(scientificName.length - 1) === '*') {
                    //restricted species RR
                    if (value[elem]['Range restricted species']) {
                        rangeRestrictedSpecies = value[elem]['Range restricted species']
                        pObj.addText(rangeRestrictedSpecies + ' ', { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }
                    //Peruvian Endemic E
                    if (value[elem]['Peruvian Endemic'] || matchArray.includes(scientificName)) {
                        peruvianEndemic = value[elem]['Peruvian Endemic']
                        console.log("endemicos: ", scientificName)
                        pObj.addText('E ', { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }
                    scientificName = ' (' + scientificName.slice(0, scientificName.length - 1) + ')*';
                    pObj.addText(commonName, { bold: true, font_face: 'Calibri', font_size: 12 })
                    pObj.addText(scientificName, { bold: true, font_face: 'Calibri', font_size: 12 })
                    //Endemic to Peru 
                    if(peruvianEndemic){
                        pObj.addText(' ' + peruvianEndemic, { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }

                    //Vulnerable (VU)
                    if (value[elem]['Vulnerable']) {
                        vulnerable = value[elem]['Vulnerable']
                        pObj.addText(' ' + vulnerable, { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }
                    // here is the function
                    addComments();

                    addBlackComments();

                    addCommentsGroup();

                    pObj.addLineBreak();
                    pObj.addLineBreak();

                } else {
                    scientificName = ' (' + scientificName + ')'
                    //restricted species RR
                    if (value[elem]['Range restricted species']) {
                        rangeRestrictedSpecies = value[elem]['Range restricted species']
                        pObj.addText(rangeRestrictedSpecies + ' ', { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }
                    //Peruvian Endemic E
                    if (value[elem]['Peruvian Endemic'] || matchArray.includes(scientificName)) {
                        peruvianEndemic = value[elem]['Peruvian Endemic']
                        console.log("endemicos: ", scientificName)
                        pObj.addText('E ', { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }
                    pObj.addText(commonName, { bold: true, font_face: 'Calibri', font_size: 12 })
                    pObj.addText(scientificName, { bold: true, font_face: 'Calibri', font_size: 12 })
                    
                    //Endemic to Peru 
                    if(peruvianEndemic){
                        pObj.addText(' ' + peruvianEndemic, { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }

                    //Vulnerable (VU)
                    if (value[elem]['Vulnerable']) {
                        vulnerable = value[elem]['Vulnerable']
                        pObj.addText(' ' + vulnerable, { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                    }
                        //here is the function
                        addComments();

                        addBlackComments();

                        addCommentsGroup();
    
                    pObj.addLineBreak()
                    pObj.addLineBreak()
                    pObj.addText(locationDetails, { font_face: 'Calibri', font_size: 12 })

                    pObj.addLineBreak()
                    pObj.addLineBreak()
                }
            }
        }
    }
    // Let's generate the Word document into a file:

    let out = fs.createWriteStream('exampleSeptiembre.docx')

    out.on('error', function(err) {
        console.log(err)
    })

    // Async call to generate the output file:
    docx.generate(out)

    return filteredData;
}

// return a Promise
const readFilePromise = () => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(`/home/alexf/react_2020/REACT_FILE_UPLOAD/client/public/uploads/MyEBirdData.csv`)
            .pipe(csv())
            .on('data', data => results.push(data))
            .on('end', () => {
                resolve(results);
            });
    })
}

//handling the Promise and using filterData function 
readFilePromise()
    .then(result => filterData(result))
    .catch(error => console.log(error))
    
}



module.exports = {
    mySpecialFunction: mySpecialFunction
};


