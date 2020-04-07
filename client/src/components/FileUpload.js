import React, { Fragment, useState} from 'react';
import Message from './Message';
import Progress from './Progress';
import DateForm from './DateForm';
import axios from 'axios';
import Spinner from './Spinner';
import moltres from '../images/moltres.png';
import articuno from '../images/articuno.png';
import zapdos from '../images/zapdos.png';


const FileUpload = () => {

  const [file, setFile] = useState('');
  const [filename, setFilename] = useState('Choose File');
  const [uploadedFile, setUploadedFile] = useState('uploadForm');
  const [message, setMessage] = useState('');
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [dates, setDates] = useState({});
  const [loading, setLoading] = useState('')
  const [generatedFile, setGeneratedFile] = useState('');
  const [downloadedFile, setDownloadedFile] = useState('');

  const onChange = e => {
    setFile(e.target.files[0]);
    setFilename(e.target.files[0].name);
  };

  const onSubmit = async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: progressEvent => {
          setUploadPercentage(
            parseInt(
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
            )
          );

          // Clear percentage
          setTimeout(() => setUploadPercentage(0), 5000);
        }
      });

      const {fileName} = res.data;

      setTimeout(() =>  setUploadedFile('uploaded'), 6000);
     
      setMessage('Your file has been Uploaded');
      
      setTimeout(() =>  setMessage('In order to generate your report, you need to enter the correct dates with the format mm/dd/yyyy.'), 6000);


    } catch (err) {
      if (err.response.status === 500) {
        setMessage('There was a problem with the server');
      } else {
        setMessage(err.response.data.msg);
      }
    }
  };

  const getDates = (date) => {
   setDates(date)
    //obtengo date de la función dentro del componente DateForm.js, es un dato dirigido de child-component a parent-component
    //luego actualizo el state de este componente    
    setMessage('Now click on Generate Button below, in order to generate your report') 
    setUploadedFile('');
  }

 
  
  const generate = async() => {
    setMessage('We are processing all the data, your file will be ready in a few seconds ...')
    setLoading('start loading');
 
    //aqui quiero hacer un htttp post enviando el state dates que contiene el dato
    const res =  await axios.post('http://localhost:5000/dates', { 
      myDates: dates, filename: filename})
      .then(res => setLoading(res.data.loading))
      .catch(err => console.log(err.data))

    //setLoading(loadingKey);
    setMessage('Thanks for your patience, your report is ready. Click on Download Button.')
    setUploadedFile('');
    setGeneratedFile('yes');
    setDates({});
  }

  const onSubmitDownload = (e) => {
    e.preventDefault()
    window.open('http://localhost:5000/download');
    setGeneratedFile('')
    setDownloadedFile('Done')
    setMessage('Thanks for using Report Birding App. Moltres is happy!')
  }

  const initialRender = (e) => {
    e.preventDefault()
    setUploadedFile('uploadForm');
    setFilename('Choose File');
    setMessage('');
    setDownloadedFile('');
  }


  let uploadBehavior;

  if(uploadedFile === 'uploadForm'){
    uploadBehavior = <form onSubmit={onSubmit}>
    <div className='custom-file mb-4'>
      <input
        type='file'
        className='custom-file-input'
        id='customFile'
        onChange={onChange}
      />
      <label className='custom-file-label' htmlFor='customFile'>
        {filename}
      </label>
    </div>

    <Progress percentage={uploadPercentage} />

    <input
      type='submit'
      value='Upload'
      className='btn btn-primary btn-block mt-4'
    />
  </form> 
  }

  else if( uploadedFile === 'uploaded') {
      uploadBehavior = <div className='row mt-5'>
      <div className='col-md-6 m-auto'>
        
        <h3 className='text-center'>{uploadedFile.fileName}</h3>
        {/*<img style={{ width: '100%' }} src={uploadedFile.filePath} alt='' />*/}

        <DateForm getDates={getDates}/>
        
      </div> 
    </div>    
  }

  else {
    uploadBehavior = '';
  }
  

  let datesBehavior;


  function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
  }

if(isEmpty(dates)) {
  datesBehavior = null;
} else {
  datesBehavior = <div className="text-center">
    <img src={articuno} alt="articuno" />
    <input onClick={generate} type='submit'value='Generate Report' className='btn btn-primary btn-block mt-4'/>
  </div>
}
  
  return (
   
    <Fragment>
      {loading ? <Spinner /> : null}
      <Fragment>
        {message ? <Message msg={message} /> : null}
        {uploadBehavior}
        {datesBehavior}
        {generatedFile ? <div className="text-center">
              <img src={zapdos} alt="zapdos" />
              <form onSubmit = {onSubmitDownload} >
                <input type="submit" value="Download" className="btn btn-primary btn-block mt-4" target="_self"/>
              </form>
              </div>: null}
          {downloadedFile ? 
            <div className="text-center">
              <img src={moltres} alt="moltres" />
              <input onClick={initialRender} type="button" value="Try Again" className="btn btn-primary btn-block mt-4" target="_self"/>
            </div>: null
          }
      </Fragment>
    </Fragment>
    
  );
};

export default FileUpload;
/*
*/

