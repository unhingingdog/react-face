import React, { Component } from 'react';
import * as pico from './pico'
import calculateFaceSizeScale from './calculateFaceSizeScale'

export default class App extends Component {
  constructor(props) {
    super(props)

    this.ctx = null
    this.video = document.createElement("video")
    this.baseFaceSize = 100

    this.state = { 
      currentCanvasSizeIndex: 100,
      detectionActive: true,
      facesData: {},
      faceScale: 1, 
      first: null,
      height: this.maxHeight,
      noFaceFrames: 0,
      highFaceFrames: 0,
      testPosition: 1
    }
  }

  detect = () => {
      const width = 4 * this.state.currentCanvasSizeIndex
      const height = 3 * this.state.currentCanvasSizeIndex
      this.canvas.width = width
      this.canvas.height = height
      this.ctx.drawImage(this.video, 0, 0, width, height)
      
      const detectedFacesData = pico.processfn(
        this.ctx, 
        this.baseFaceSize * this.state.faceScale,
        height,
        width
      ).filter(face => face[3] > 200)
      let newFacesData = []
      let bestDetectionData = [0, 0]

      if (detectedFacesData.length) {
        detectedFacesData.map((detectedFaceData, index) => {
          const newFaceData = {}
          const [y, x, size, strength] = detectedFaceData

          newFaceData.y = y
          newFaceData.x = x
          newFaceData.size = size * 0.65
          newFaceData.strength = strength

          if (bestDetectionData[0] < strength) {
            bestDetectionData = [strength, index]
          }

          newFacesData.push(newFaceData)
        })
      }

      const { 
        faceScale, 
        currentCanvasSizeIndex, 
        noFaceFrames,
        highFaceFrames 
      } = this.state

      let newCanvasSizeIndex = currentCanvasSizeIndex
      let newNoFaceFrames = noFaceFrames
      let newHighFaceFrames = highFaceFrames
      const [bestDetection] = bestDetectionData
      let newFaceScale = Math.max(calculateFaceSizeScale(bestDetection), 0.01) 
        || faceScale


      if (bestDetection > 300) {
        if (newHighFaceFrames < 5) {
          newHighFaceFrames = newHighFaceFrames + 1
        } else {
          newCanvasSizeIndex = Math.max(
            newCanvasSizeIndex - 1,
            10
          )
          newHighFaceFrames = 0
        }
      } else {
        newHighFaceFrames = 0
      }

      if (!newFacesData.length) {
          if (newNoFaceFrames < 2) {
            newNoFaceFrames = newNoFaceFrames + 1
          } else {
            newCanvasSizeIndex = Math.min(
              newCanvasSizeIndex + 1,
              500
            )
            newNoFaceFrames = 0
          }
      } else {
        newNoFaceFrames = 0
      }

      newFacesData.map(face => {
        this.ctx.beginPath();
        this.ctx.arc(face.x, face.y, face.size, 0, 2 * Math.PI, false);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = face.strength < 100 ? 'red' : 'aqua';
        this.ctx.stroke();
      })

      return { 
        newFacesData,
        newFaceScale,
        newCanvasSizeIndex,
        newNoFaceFrames,
        newHighFaceFrames
      }
  }

  async componentDidMount() {
    const stream = await navigator
      .mediaDevices.getUserMedia({ video: true, audio: false })

    this.video.srcObject = stream
    this.video.play()
    this.ctx = this.canvas.getContext('2d')
		
		pico.picoInit()

    if (this.state.detectionActive) {
      window.requestAnimationFrame(() => {
        const { 
          newFacesData,
          newFaceScale,
          newCanvasSizeIndex,
          newNoFaceFrames,
          newHighFaceFrames
        } = this.detect()

        this.setState(() => ({ 
          facesData: newFacesData,
          faceScale: newFaceScale,
          currentCanvasSizeIndex: newCanvasSizeIndex,
          noFaceFrames: newNoFaceFrames,
          highFaceFrames: newHighFaceFrames
        }))
      })
    }
  }

  componentDidUpdate() {
    if (this.state.detectionActive) {
      window.requestAnimationFrame(() => {
        console.time('x')
        const { 
          newFacesData,
          newFaceScale,
          newCanvasSizeIndex,
          newNoFaceFrames,
          newHighFaceFrames
        } = this.detect()

        this.setState(() => ({ 
          facesData: newFacesData,
          faceScale: newFaceScale,
          currentCanvasSizeIndex: newCanvasSizeIndex,
          noFaceFrames: newNoFaceFrames,
          highFaceFrames: newHighFaceFrames,
          testPosition: (this.state.testPosition + 1) % 500
        }))
        console.timeEnd('x')
      })
    }
  }

  // shouldComponentUpdate(_, nextState) {
  //   if (this.state.noFaceFrames > 3) {
  //     return JSON.stringify(nextState.facesData[0]) !== 
  //     JSON.stringify(this.state.facesData[0])
  //   }
  //   return true
  // }

  render() {
    // const [width, height] = this.canvasSizes[this.state.currentCanvasSizeIndex]
    const width = 4 * this.state.currentCanvasSizeIndex
    const height = 3 * this.state.currentCanvasSizeIndex

    return (
      <div className="App">
        <header className="App-header" style={{ display: 'flex', flexDirection: 'column' }}>
          <canvas 
            ref={ref => this.canvas = ref} 
            style={{ display: 'absolute' }}
          />
          <div
            style={{
              position: 'absolute',
              width: 20,
              height: 20,
              background: 'goldenrod',
              top: 500,
              transform: `translate(${this.state.testPosition}px, 0px)`
            }}
          ></div>
        </header>
      </div>
    )
  }
}
