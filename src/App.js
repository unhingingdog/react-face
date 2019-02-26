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
      detectionTimes: new Array(60).fill(0),
      framesSinceUpdate: 0,
      splitRenderMode: true,
      splitRenderPhase: 0,
      testPosition: 1
    }
  }

  updateCanvas = () => {
    const width = 4 * this.state.currentCanvasSizeIndex
    const height = 3 * this.state.currentCanvasSizeIndex
    this.canvas.width = Math.floor(width)
    this.canvas.height = Math.floor(height)
    this.ctx.drawImage(this.video, 0, 0, width, height)
  }

  detect = () => {
        const width = 4 * this.state.currentCanvasSizeIndex
        const height = 3 * this.state.currentCanvasSizeIndex
        this.canvas.width = Math.floor(width)
        this.canvas.height = Math.floor(height)
        this.ctx.drawImage(this.video, 0, 0, width, height)
      
      const detectedFacesData = pico.processfn(
        this.ctx, 
        this.baseFaceSize * this.state.faceScale,
        height,
        width
      ).filter(face => face[3] > 15)

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
            newCanvasSizeIndex - 2,
            10
          )
          newHighFaceFrames = 0
        }
      } else {
        newHighFaceFrames = 0
      }

      if (!newFacesData.length) {
          if (newNoFaceFrames < 3) {
            newNoFaceFrames = newNoFaceFrames + 1
          } else {
            newCanvasSizeIndex = Math.min(
              newCanvasSizeIndex + 2,
              200
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
    this.ctx = this.canvas.getContext('2d', { alpha: false })
		
		pico.picoInit()

    if (this.state.detectionActive) {
      window.requestIdleCallback(deadline => {
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
        const detectionStart = performance.now()

        const { 
          newFacesData,
          newFaceScale,
          newCanvasSizeIndex,
          newNoFaceFrames,
          newHighFaceFrames
        } = this.detect()

        const detectionEnd = performance.now()

        this.setState(() => ({ 
          facesData: newFacesData,
          faceScale: newFaceScale,
          currentCanvasSizeIndex: newCanvasSizeIndex,
          noFaceFrames: newNoFaceFrames,
          highFaceFrames: newHighFaceFrames,
          detectionTimes: this.updateDetectionTimes(detectionStart, detectionEnd),
          framesSinceUpdate: 0,
          testPosition: (this.state.testPosition + 2) % 1000
        }))
      })
    }
  }

  updateDetectionTimes = (detectionStart, detectionEnd) => {
    const { detectionTimes } = this.state

    detectionTimes.push(detectionEnd - detectionStart)
    if (detectionTimes.length > 60) detectionTimes.shift()

    return detectionTimes
  }

  render() {
    return (
      <div className="App">
        <header className="App-header" style={{ display: 'flex', flexDirection: 'column' }}>
          <canvas 
            ref={ref => this.canvas = ref} 
            style={{ display: 'absolute' }}
          />
          <h1>{this.state.detectionTimes.reduce((acc, n) => acc + n) / 60}</h1>
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
