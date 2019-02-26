import React from 'react'
import FaceDetector from './FaceDetector'
import TestMover from './TestMover'

const App = props => {
    return (
        <React.Fragment>
            <FaceDetector />
            <TestMover startPosition={0} />
            <TestMover startPosition={5} />
            <TestMover startPosition={10} />
            <TestMover startPosition={15} />
            <TestMover startPosition={20} />
            <TestMover startPosition={25} />
            <TestMover startPosition={30} />
            <TestMover startPosition={35} />
            <TestMover startPosition={40} />
            <TestMover startPosition={45} />
            <TestMover startPosition={50} />
            <TestMover startPosition={55} />
        </React.Fragment>
    )
}

export default App