import React from 'react';

const Generate = () => {

    const onGenerate = e => {
        console.log('Hola')
    }

    return ( 
        <input onSubmit={onGenerate} type='submit'value='Generate' className='btn btn-primary btn-block mt-4'/>
    );
}

export default Generate;
