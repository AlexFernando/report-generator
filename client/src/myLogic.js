
const csv = require('csv-parser');
const fs = require('fs')
const officegen = require('officegen');


function mySpecialFunction(initialDate, endDate, filename) {


    let results = []; //to save data after reading the file
    let filteredData = []; // data ready to write on the file 
    let excelData = require('./excelParserFilter')
    let excelComments = require('./excelComments')

    let filenameUploaded = filename;
    
    console.log("filename: ", filenameUploaded);
    
    let familyData = excelData.familyResults();
    
    let commentsData = excelComments.commentsResults();
    
    let regExp = /\(([^)]+)\)/;
    
    let regExpGroup = /(\(\b)/;
    
    let subSpecieRegex = /(Ssp\.)\s[A-Za-z]*(\:)/gm
    
    
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
            let date1 = initialDate; // parameters to filter (dates)
            let date2 = endDate;
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
        let finalMatchComments = [];
    
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
    
        //console.log("clean keys: ", cleanKeys);
    
        let arrOfSsp = [];
        let arrOfSspNames = [];
        let arrOfLocationSsp = [];
        let finalArrOfSsp = [];
        let finalArrOfSspNames = [];
        
        cleanKeys.map( (element => {
            if(element['Observation Details']){
                if(element['Observation Details'].match(subSpecieRegex)){
     
                    let sspElem = element['Observation Details'].match(subSpecieRegex);
                    
                    arrOfSsp.push(sspElem[0]);
                    arrOfSspNames.push(element['Common Name']);
                    arrOfLocationSsp.push(element['Location']);
                }
            }
        }))
    
        const setOfSsp = new Set(arrOfSsp);
        const setOfSspNames = new Set(arrOfSspNames);    
    
        finalArrOfSsp = [...setOfSsp];
        finalArrOfSspNames = [...setOfSspNames];
      
    
        console.log("array of ssp", finalArrOfSsp, '   ', finalArrOfSspNames, '   ', arrOfLocationSsp);
    
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
            matchComments = commentsData.find(myElem => myElem['EnglishName'].trim() === elem['Common Name'])
    
            if (matchComments) {
                console.log("comentarios: " ,matchComments);
                /*if(elem['EnglishName'] === 'Booted Racket-tail'){
                    console.log(matchComments);
                }*/
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
    
                if (arrayScientificName.length >= 3 && (arrayScientificName.indexOf('(') === -1) && (arrayScientificName.indexOf(')') === -1) ) {
                    //popped = arrayScientificName.pop();
    
                    let myMainSpecie = arrayScientificName[0] +' ' + arrayScientificName[1];
    
                    //arrayOfPoppedElem.push(popped);
    
                    let myGroupSpecie = arrayScientificName.join(' ');
    
                    myArrayOfGroups.push(myMainSpecie);
                    myArrayOfGroups.push(myGroupSpecie);
                }
            }
        }
    
    
    
        //console.log("grupos: ", myArrayOfGroups);
    
        const mySet = new Set(myArrayOfGroups); 
    
        arrayOfFinalGroups = [...mySet];
    
        for (let i = 0; i < arrayOfFinalGroups.length - 1; i++) {
            //console.log("este es una coincidence: ", arrayOfFinalGroups[i].match(regExpGroup));
            if (arrayOfFinalGroups[i].match(regExpGroup)) {
                arrayOfFinalGroups[i] = "NoGroup";
            }
        }
        
        console.log("grupos finales", arrayOfFinalGroups);
    
        let numIndex = 0;
        let subIndex = 0;
        let newIndexBoldWord = -1;
        let newIndexItalicWord = -1; 
        let newIndexUnderlineWord = 0;
        let countNoSpecie = 0
        let prevScientificName = 'Un test';
    
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
                let observationsDetails = value[elem]['Observation Details']
                //console.log(observationsDetails, ' ',commonName);
    
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
                let underlineComments = '';
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
                    let indexGray = 0; 
                    let indexUnderline = 0;     
    
                    if (value[elem]['black_comment']){
    
                        //array of final comments 
                        finalMatchComments.push(value[elem]['Common Name']);

                        pObj.addLineBreak();
                        pObj.addLineBreak();
                        blackComments = value[elem]['black_comment'];
                        let arrayOfBlackComments = blackComments.split(' ');
    
                        let arrayOfIndexGrayComments = [];
                        let arrayOfStringsGrayComments = [];
    
                        if(value[elem]['gray_comment']){
    
                            grayComments = value[elem]['gray_comment'];
                            arrayOfStringsGrayComments = cursivaComments.split('-');
    
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
    
                            if(scientificName.trim() === 'Saltator maximus' || scientificName.trim() === 'Pyrocephalus rubinus' || scientificName.trim() === 'Megascops watsonii' || scientificName.trim() === 'Heliodoxa aurescens' || scientificName.trim() === 'Ocreatus underwoodii'){
                                for(let i = 0; i < arrayOfStringsItalics.length; i++){
                                //console.log("solo otro array de black comments : ", arrayOfBlackComments)
                                if(arrayOfBlackComments.indexOf(arrayOfStringsItalics[i], newIndexItalicWord+1) > -1) {
                                    newIndexItalicWord = arrayOfBlackComments.indexOf(arrayOfStringsItalics[i], newIndexItalicWord+1);                               
                                    arrayOfIndexItalics.push(newIndexItalicWord)
                                    arrayOfBlackComments[newIndexItalicWord] = "*inBold*";
                                }
                            }
                            }
                            else {
                                for(let i = 0; i < arrayOfStringsItalics.length; i++){
                                    if(arrayOfBlackComments.indexOf(arrayOfStringsItalics[i]) > -1) {
                                        arrayOfIndexItalics.push(arrayOfBlackComments.indexOf(arrayOfStringsItalics[i]))
                                        arrayOfBlackComments[arrayOfBlackComments.indexOf(arrayOfStringsItalics[i])] = "*inBold*";
                                    }
                                }
                            }
                        }
                            
                      
    
                        let arrayOfIndexItalicsBold = [];
                        let arrayOfStringsCursivaBold = [];
                    
                        if(value[elem]['cm_cursiva_bold']){
                            cursivaBoldComments = value[elem]['cm_cursiva_bold'];
                            arrayOfStringsCursivaBold = cursivaBoldComments.split('-');
    
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
                            arrayOfStringsBold = boldWordsComments.split('*|');
    
                            if(scientificName === 'Ocreatus underwoodii'){
                                for(let i = 0; i < arrayOfStringsBold.length; i++){
                                //console.log("solo otro array de black comments : ", arrayOfBlackComments)
                                if(arrayOfBlackComments.indexOf(arrayOfStringsBold[i], newIndexBoldWord+1) > -1) {
                                    newIndexBoldWord = arrayOfBlackComments.indexOf(arrayOfStringsBold[i], newIndexBoldWord+1);                               
                                    arrayOfIndexBoldWords.push(newIndexBoldWord)
                                    arrayOfBlackComments[newIndexBoldWord] = "*inBold*";
                                }
                            }
                            }
    
                            else{
                                for(let i = 0; i < arrayOfStringsBold.length; i++){
                                    if(arrayOfBlackComments.indexOf(arrayOfStringsBold[i]) > -1) {
                                        arrayOfIndexBoldWords.push(arrayOfBlackComments.indexOf(arrayOfStringsBold[i]))
                                        arrayOfBlackComments[arrayOfBlackComments.indexOf(arrayOfStringsBold[i])] = "*inBold*";
                                    }
                                }
                            
                            }
                        
                            
                            //console.log("array of black comments", arrayOfBlackComments);
                          
                        }
    
                        let arrayOfIndexUnderlineWords = [];
                        let arrayOfStringsUnderline = [];
    
                   
                        if(value[elem]['underline_comments']){
                            boldWordsComments = value[elem]['underline_comments'];
                            arrayOfStringsUnderline = boldWordsComments.split('-');
    
                            if(scientificName === 'Saltator maximus'){
                                for(let i = 0; i < arrayOfStringsUnderline.length; i++){
                                //console.log("solo otro array de black comments : ", arrayOfBlackComments)
                                if(arrayOfBlackComments.indexOf(arrayOfStringsUnderline[i], newIndexUnderlineWord) > -1) {
                                    newIndexUnderlineWord = arrayOfBlackComments.indexOf(arrayOfStringsUnderline[i], newIndexUnderlineWord);                               
                                    arrayOfIndexUnderlineWords.push(newIndexUnderlineWord)
                                    arrayOfBlackComments[newIndexUnderlineWord] = "*inBold*";
                                }
                            }
                            }
    
                            else {
                                for(let i = 0; i < arrayOfStringsUnderline.length; i++){
                                    if(arrayOfBlackComments.indexOf(arrayOfStringsUnderline[i]) > -1) {
                                        arrayOfIndexUnderlineWords.push(arrayOfBlackComments.indexOf(arrayOfStringsUnderline[i]))
                                        arrayOfBlackComments[arrayOfBlackComments.indexOf(arrayOfStringsUnderline[i])] = "*inBold*";
                                    }
                                }
                            }
    
                           
                            //console.log("array of black comments", arrayOfBlackComments);
                          
                        }
    
                        //console.log("indexBold: ",arrayOfIndexBoldWords);
                        //console.log("indexBoldItalics: ",arrayOfIndexItalicsBold);
                        for(let j = 0; j < arrayOfBlackComments.length; j++){
                            
                            if(arrayOfIndexBoldWords.includes(j)){ 
                                //console.log(arrayOfBlackComments[j])
                                pObj.addText(arrayOfStringsBold[iBold] + ' ', {bold: true, font_face: 'Calibri', font_size: 12 });
                                //console.log("los index bold: ", j)
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
    
                            else if (arrayOfIndexUnderlineWords.includes(j)) {
                                pObj.addText(arrayOfStringsUnderline[indexUnderline] + ' ', {underline: true ,font_face: 'Calibri', font_size: 12 });
                                //console.log("j: ", j)
                                indexUnderline++;
                            }
    
    
                            
                            else{
                                if(arrayOfBlackComments[j] === '|'){
                                    //console.log("hey:" , arrayOfBlackComments[j]," ", j );
                                    arrayOfBlackComments[j] = '';
                                    //console.log("hey:" , arrayOfBlackComments[j]," ", j );
                                    pObj.addText(arrayOfBlackComments[j], {font_face: 'Calibri', font_size: 12 });
                                    pObj.addLineBreak();
                                    pObj.addLineBreak();
                                    
                                }  
                                else {
                                    pObj.addText(arrayOfBlackComments[j] + ' ', {font_face: 'Calibri', font_size: 12 });
                                 
                                }
                            }   
                            
                        }

                        pObj.addLineBreak();
                    }
                   
                }
    
                const addCommentsGroupOne = () => {
                                    
                    if (value[elem]['light_blue_group']){
                        lightBlueGroup = value[elem]['light_blue_group'];
                        finalMatchComments.push(value[elem]['Common Name']);
                        pObj.addLineBreak();
                        pObj.addLineBreak();
                        pObj.addText('       '+lightBlueGroup, {color: '0070C0', font_face: 'Calibri', font_size: 12 });
                    }
    
                    if (value[elem]['red_group']){
                        redGroup = value[elem]['red_group'];
                        finalMatchComments.push(value[elem]['Common Name']);
                        pObj.addLineBreak();
                        pObj.addLineBreak();
                        pObj.addText('       '+redGroup, {color: 'ff0000' , font_face: 'Calibri', font_size: 12 });
                    }
    
                    if (value[elem]['light_purple_group']){
                        lightPurpleGroup = value[elem]['light_purple_group'];
                        finalMatchComments.push(value[elem]['Common Name']);
                        pObj.addLineBreak();
                        pObj.addLineBreak();
                        pObj.addText('       '+lightPurpleGroup, {color:'CC00CC', font_face: 'Calibri', font_size: 12 });
                    }
    
                    if (value[elem]['comments_group']){
                        commentsGroup = value[elem]['comments_group'];
                        finalMatchComments.push(value[elem]['Common Name']);
                        pObj.addLineBreak();
                        pObj.addLineBreak();
                        pObj.addText('       '+commentsGroup, {font_face: 'Calibri', font_size: 12 });
                    }
    
                    if (value[elem]['blue_3']){
                        blueThree = value[elem]['blue_3'];
                        finalMatchComments.push(value[elem]['Common Name']);
                        pObj.addLineBreak();
                        pObj.addLineBreak();
                        pObj.addText('       '+blueThree, {color: '0070C0', font_face: 'Calibri', font_size: 12 });
                    }
                    
                    if (value[elem]['red_3']){
                        redThree = value[elem]['red_3'];
                        finalMatchComments.push(value[elem]['Common Name']);
                        pObj.addLineBreak();
                        pObj.addLineBreak();
                        pObj.addText('       '+redThree, {color: 'ff0000', font_face: 'Calibri', font_size: 12 });
                    }
    
                    else {
                        return -1;
                    }
                }
    
                const addCommentsGroupTwo = () => {
    
                    if (value[elem]['light_blue_group2']){
                        lightBlueGroup2 = value[elem]['light_blue_group2'];
                        finalMatchComments.push(value[elem]['Common Name']);
                        pObj.addLineBreak();
                        pObj.addLineBreak();
                        pObj.addText('       '+lightBlueGroup2, {color:'0070C0', font_face: 'Calibri', font_size: 12 });
                    }
    
                    if (value[elem]['red_group2']){
                        redGroup2 = value[elem]['red_group2'];
                        finalMatchComments.push(value[elem]['Common Name']);
                        pObj.addLineBreak();
                        pObj.addLineBreak();
                        pObj.addText('       '+redGroup2, { color: 'ff0000', font_face: 'Calibri', font_size: 12 });
                    }
    
                    else {
                        return -1;
                    }
                }
    
                /*comment functions ends*/
                
                numIndex++;
                let indexSsp;
                let SspName;
                let locationSsp;
     
                /* ssp function start*/
    
                const addSspComment = () => {
    
                    if(finalArrOfSspNames.includes(commonName)) {
                        indexSsp = finalArrOfSspNames.indexOf(commonName);
                        SspName = finalArrOfSsp[indexSsp];
                        locationSsp = arrOfLocationSsp[indexSsp];
                    }
    
                    if(SspName && locationSsp){
                        pObj.addText('           ' + SspName, {bold: true, font_face: 'Calibri', font_size: 12 })
                        pObj.addLineBreak()
                        pObj.addText('           ' + locationSsp, { font_face: 'Calibri', font_size: 12 })
                        pObj.addLineBreak()
                        pObj.addLineBreak()
                    }
                }
                   
                
                /**Ssp function ends */
    
    
                if (arrayOfFinalGroups.includes(scientificName)) {
    
                    console.log('Scientfic Name: ', scientificName);
    
                    let convertToArr = scientificName.split(' ');
    
                    if (convertToArr.length === 2) {
                        
                        subIndex = 0;
    
                        countNoSpecie++;
    
                        myElemGroup = elem;
    
                        pObj.addText(numIndex + '. ', { bold: true, font_face: 'Calibri', font_size: 12 })
                        //restricted species RR
                        if (value[elem]['Range restricted species']) {
                            rangeRestrictedSpecies = value[elem]['Range restricted species']
                            pObj.addText(rangeRestrictedSpecies + ' ', { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                        }
    
                        //Peruvian Endemic E
                        if (value[elem]['Peruvian Endemic'] || matchArray.includes(scientificName)) {
                            peruvianEndemic = value[elem]['Peruvian Endemic']
                            //("endemicos: ", scientificName)
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
                        
                        pObj.addLineBreak()
                        pObj.addLineBreak()
    
                        pObj.addText(locationDetails, { font_face: 'Calibri', font_size: 12 })
    
                        pObj.addLineBreak()
                        pObj.addLineBreak()
    
                        addSspComment();
                        //pObj.addText(vulnerable, { bold: true, color: 'cb3234', font_face: 'Calibri', font_size: 12 })
                    } else {
                        subIndex++;
                
                        if(countNoSpecie === 0) {
    
                            let arrCommonName = commonName.split(' ');
                            let arrScientificName = scientificName.split(' ');
                            let commonNameLost = arrCommonName[0] + ' ' + arrCommonName[1];
                            let scientificNameLost = arrScientificName[0] + ' ' + arrScientificName[1];
                            let arrPrevScientificName = prevScientificName.split(' ');
                            let prevScientificNameTitle = arrPrevScientificName[0] + arrPrevScientificName[1];
    
                            if(commonNameLost === prevScientificNameTitle){
                                pObj.addText(numIndex + '. ', { bold: true, font_face: 'Calibri', font_size: 12 })
                                pObj.addText(commonNameLost, { bold: true, font_face: 'Calibri', font_size: 12 })
                                pObj.addText(' (' + scientificNameLost + ')', { bold: true, font_face: 'Calibri', font_size: 12 })
                                pObj.addLineBreak()
                                pObj.addLineBreak()
                            }
                        }
    
                        prevScientificName = scientificName;
    
                        //restricted species RR
                        if (value[elem]['Range restricted species']) {
                            rangeRestrictedSpecies = value[elem]['Range restricted species']
                            pObj.addText(rangeRestrictedSpecies + ' ', { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                        }
                        //Peruvian Endemic E
                        if (value[elem]['Peruvian Endemic'] || matchArray.includes(scientificName)) {
                            peruvianEndemic = value[elem]['Peruvian Endemic']
                            //console.log("endemicos: ", scientificName)
                            pObj.addText('E ', { bold: true, color: 'ff0000', font_face: 'Calibri', font_size: 12 })
                        }
                        
                        pObj.addText('       '+ commonName + ' - ', { bold: true, font_face: 'Calibri', font_size: 12 })
                        pObj.addText(' (' + scientificName + ')', { bold: true, italic:true, font_face: 'Calibri', font_size: 12 })
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
    
                        if(subIndex === 1) {
                            addCommentsGroupOne();
                        }
    
                        if(subIndex === 2) {
                            addCommentsGroupTwo();
                        }
                                    
                        pObj.addLineBreak()
                        pObj.addLineBreak()
    
                        pObj.addText('       '+'Seen at: ' + locationDetails, { font_face: 'Calibri', font_size: 12 })
    
                        pObj.addLineBreak()
                        pObj.addLineBreak()
                        
                        addSspComment();
    
                        countNoSpecie = 0;
                        numIndex--;
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
                            //console.log("endemicos: ", scientificName)
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
    
                        //addCommentsGroup();
    
                        pObj.addLineBreak();
                        pObj.addLineBreak();
    
                        addSspComment();
    
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
                            //console.log("endemicos: ", scientificName)
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
    
                            //addCommentsGroup();
        
                        pObj.addLineBreak()

                        pObj.addText(locationDetails, { font_face: 'Calibri', font_size: 12 })
    
                        pObj.addLineBreak()
                        pObj.addLineBreak()
    
                        addSspComment();
                    }
                }
            }
        }
    
        pObj1 = docx.createP()
        pObj1.addText('ANEXO', {bold: true, color: '188c18', font_face: 'Calibri', font_size: 16 })
        pObj1.addLineBreak()
        pObj1.addLineBreak()
        pObj1.addText('Scientific Names of Groups', {bold: true, font_face: 'Calibri', font_size: 16 })
        pObj1.addLineBreak()
        pObj1.addLineBreak()
        for(let i = 0; i < arrayOfFinalGroups.length; i++){
            pObj1.addText(arrayOfFinalGroups[i], {font_face: 'Calibri', font_size: 12 })
            pObj1.addLineBreak()
        }
    
        pObj1.addLineBreak()
        pObj1.addText('Species with Comments', {bold: true, font_face: 'Calibri', font_size: 16 })
        pObj1.addLineBreak()
        pObj1.addLineBreak()

        for(let i = 0; i < finalMatchComments.length; i++) {
            pObj1.addText(finalMatchComments[i], {font_face: 'Calibri', font_size: 12 })
            pObj1.addLineBreak()
        }

        pObj1.addLineBreak()
        pObj1.addLineBreak()
    
        pObj1.addText('Comments SubSpecies', {bold: true, font_face: 'Calibri', font_size: 16 })
        pObj1.addLineBreak()
        pObj1.addLineBreak()

        if(finalArrOfSsp.length === 0){
            pObj1.addText('There are no comments for subspecies' , {font_face: 'Calibri', font_size: 12 })
        }
    
        else{
            for(let i = 0; i < finalArrOfSsp.length; i++) {
                pObj1.addText(finalArrOfSsp[i], {font_face: 'Calibri', font_size: 12 })
                pObj1.addLineBreak()
            }
        }
        // Let's generate the Word document into a file:
    
        let out = fs.createWriteStream('Report.docx')
    
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
            fs.createReadStream(__dirname +`/../../uploads/${filenameUploaded}`)
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


