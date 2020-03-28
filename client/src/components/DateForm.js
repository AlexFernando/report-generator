import React, { useState } from "react";

const DateForm = (props) => {

  const [name, setName] = useState("");
  
  const handleSubmit = (evt) => {
      evt.preventDefault();
      props.getDates(name)
      alert(`Submitting Name ${name}`)
  }
  return (
    <form onSubmit={handleSubmit}>
      <label>
        Frirst Name:
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </label>
      <input type="submit" value="Submit" />
    </form>
  );
}


export default DateForm;


