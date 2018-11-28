import React from 'react'

export default ({ value, changeHander, name }) => {
  return(
    <input
      value={value}
      onChange={changeHander}
      name={name}
    />)
}
