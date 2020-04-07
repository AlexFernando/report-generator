import React, { useState, useRef } from "react";

const DateForm = ({getDates}) => {

  const [name, setName] = useState("");

  const initialDate = useRef();
  const endDate = useRef();
  
  const handleSubmit = (evt) => {
      evt.preventDefault();

      const dates = {
        initialDate: initialDate.current.value,
        endDate : endDate.current.value
      }

      getDates(dates)
  }
  return (
    <div>
      {/*<form onSubmit={handleSubmit}>
      <label>
        First Name:
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </label>
      <input type="submit" value="Submit" />
  </form>*/}

    <form onSubmit={handleSubmit}>
      <div className="col-12">
          <div className="form-group">
              <label for="date1">Initial Date</label>
              <input ref={initialDate}  type="date" name="date" id="date1" value={name} className="form-control form-control mt-2" onChange={e => setName(e.target.value)}/>
          </div>
      </div>

      <div className="col-12">
          <div className="form-group ">
              <label for="date2">End Date</label>
              <input ref={endDate} type="date" name="date" id="date2" className="form-control form-control mt-2"/>
          </div>
      </div>  

      <input type="submit" className='btn btn-primary btn-block mt-4' value="Submit" />    
    </form>
    </div>

  );
}


export default DateForm;


