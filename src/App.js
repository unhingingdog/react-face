import React from 'react'
import FaceDetector from './lib/FaceDetector'

const App = props => {
    return (
        <FaceDetector>
            {facesData => 
                <ul>
                    {facesData.map(face => <li>{face.x + ' ' + face.y}</li>)}
                </ul>
            }
        </FaceDetector>
    )
}

export default App