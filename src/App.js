import React from 'react'
import FaceDetector from './FaceDetector'
import TestMover from './TestMover'

const App = props => {
    return (
        <React.Fragment>
            <FaceDetector>
                {facesData => 
                    <ul>
                        {facesData.map(face => <li>{face.x + ' ' + face.y}</li>)}
                    </ul>
                }
            </FaceDetector>
            {/* <TestMover startPosition={0} inc={60} />
            <TestMover startPosition={20} inc={60} />
            <TestMover startPosition={40} inc={60} />
            <TestMover startPosition={60} inc={60} />
            <TestMover startPosition={80} inc={60} />
            <TestMover startPosition={100} inc={60}/>
            <TestMover startPosition={120} inc={60}/>
            <TestMover startPosition={140} inc={60} />
            <TestMover startPosition={160} inc={60} />
            <TestMover startPosition={180} inc={60} /> */}
        </React.Fragment>
    )
}

export default App