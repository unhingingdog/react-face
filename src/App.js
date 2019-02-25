import React, { Component } from 'react';
import * as pico from './pico'

export default class App extends Component {
  constructor(props) {
    super(props)

    this.ctx = null
    this.video = document.createElement("video")
    this.CANVAS_WIDTH = 400
    this.CANVAS_HEIGHT = 300
    this.canvasSizes = [
      // [160, 120],
      // [200, 150],
      // [240, 180],
      // [400, 300],
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
    window.requestAnimationFrame(() => {
      this.ctx = this.canvas.getContext('2d')
      const [width, height] = this.canvasSizes[this.state.currentCanvasSizeIndex]
      this.ctx.drawImage(this.video, 0, 0, width, height)
      
      const detectedFacesData = pico.processfn(
        this.ctx, this.baseFaceSize * this.state.faceScale
      ).filter(face => face[3] > 50)
      let newFacesData = []
      let bestDetection = [0, 0]

      if (detectedFacesData.length) {
        detectedFacesData.map((detectedFaceData, index) => {
          const newFaceData = {}
          const [y, x, size, strength] = detectedFaceData

          newFaceData.y = y
          newFaceData.x = x
          newFaceData.size = size
          newFaceData.strength = strength * 0.65

          if (bestDetection[0] < strength) {
            bestDetection = [strength, index]
          }

          newFacesData.push(newFaceData)
        })
      }

      const { faceScale, currentCanvasSizeIndex, noFaceFrames } = this.state

      let newFaceScale = faceScale
      let newCanvasSizeIndex = currentCanvasSizeIndex
      let newNoFaceFrames = noFaceFrames

      if (bestDetection[0] > 900) {
          newCanvasSizeIndex = 0
      }

      if (bestDetection[0] < 900 && bestDetection[0] > 700) {
        newCanvasSizeIndex = Math.min(newCanvasSizeIndex, 0)
        newFaceScale = faceScale * 1.02
      }

      if (bestDetection[0] < 700 && bestDetection > 600) {
        newFaceScale = faceScale * 1.01
      }

      if (bestDetection[0] < 600 && bestDetection > 500) {
        newFaceScale = faceScale * 1.005
      }

      if (bestDetection[0] < 500 && bestDetection > 400) {
        newFaceScale = Math.max(faceScale * 0.995, 0.1)
      }

      if (bestDetection[0] < 500 && bestDetection > 200) {
        newFaceScale = Math.max(faceScale * 0.99, 0.1)
      }

      if (bestDetection[0] < 200) {
        newFaceScale = Math.max(faceScale * 0.98, 0.1)
      }

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
    })
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
    if (this.state.detectionActive) this.detect()
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
