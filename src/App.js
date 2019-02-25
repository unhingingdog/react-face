import React, { Component } from 'react';
import * as pico from './pico'
import calculateFaceSizeScale from './calculateFaceSizeScale'

export default class App extends Component {
  constructor(props) {
    super(props)

    this.ctx = null
    this.video = document.createElement("video")
    this.CANVAS_WIDTH = 400
    this.CANVAS_HEIGHT = 300
    this.canvasSizes = [
      [600, 450],
      [800, 600]
    ]

    this.baseFaceSize = 100


    this.state = { 
      currentCanvasSizeIndex: 1,
      detectionActive: true,
      facesData: {},
      faceScale: 1, 
      first: null,
      height: this.maxHeight,
      noFaceFrames: 0
    }
  }

  detect = () => {
      console.time('detect')
      this.ctx = this.canvas.getContext('2d')
      const [width, height] = this.canvasSizes[this.state.currentCanvasSizeIndex]
      this.ctx.drawImage(this.video, 0, 0, width, height)
      
      const detectedFacesData = pico.processfn(
        this.ctx, this.baseFaceSize * this.state.faceScale
      ).filter(face => face[3] > 50)
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

      const { faceScale, currentCanvasSizeIndex, noFaceFrames } = this.state

      let newCanvasSizeIndex = currentCanvasSizeIndex
      let newNoFaceFrames = noFaceFrames
      const [bestDetection] = bestDetectionData
      let newFaceScale = Math.max(calculateFaceSizeScale(bestDetection), 0.1) 
        || faceScale


      if (bestDetection > 200) {
          newCanvasSizeIndex = 0
      }
      console.log('BEST DETECTION', bestDetection)

      if (!newFacesData.length) {
          if (newNoFaceFrames < 30) {
            newNoFaceFrames = newNoFaceFrames + 1
          } else {
            newCanvasSizeIndex = this.canvasSizes.length - 1
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

      this.setState(() => ({ 
        facesData: newFacesData,
        faceScale: newFaceScale,
        currentCanvasSizeIndex: newCanvasSizeIndex,
        noFaceFrames: newNoFaceFrames
      }))
    console.timeEnd('detect')
  }

  async componentDidMount() {
    const stream = await navigator
      .mediaDevices.getUserMedia({ video: true, audio: false })

    this.video.srcObject = stream
		this.video.play()
		
		pico.picoInit()

    if (this.state.detectionActive) this.detect()
  }

  componentDidUpdate() {
    if (this.state.detectionActive) window.requestIdleCallback(this.detect)
  }

  render() {
    const [width, height] = this.canvasSizes[this.state.currentCanvasSizeIndex]

    return (
      <div className="App">
        <header className="App-header" style={{ display: 'flex' }}>
          <canvas 
            ref={ref => this.canvas = ref} 
            width={width}
            height={height} 
            style={{ display: 'absolute' }}
          />
          <h1>{this.canvasSizes[this.state.currentCanvasSizeIndex]}</h1>
        </header>
      </div>
    )
  }
}
