import React, { Component } from 'react';
import * as pico from './pico'

export default class App extends Component {
  constructor(props) {
    super(props)

    this.ctx = null
    this.video = document.createElement("video")
    this.CANVAS_WIDTH = 800
    this.CANVAS_HEIGHT = 600
    this.baseFaceSize = 100


    this.state = { 
      detectionActive: true,
      faceData: {},
      faceScale: 1, 
      first: null,
      height: this.maxHeight
    }
  }

  detect = () => {
    window.requestAnimationFrame(() => {
      this.ctx = this.canvas.getContext('2d')

      this.ctx.drawImage(
        this.video,
        0,
        0,
        this.CANVAS_WIDTH,
        this.CANVAS_HEIGHT
      )
      
      const picoFaceData = pico.processfn(this.ctx, this.baseFaceSize * this.state.faceScale)
      let faceData = {}

      if (picoFaceData[0] && picoFaceData[0][0]) {
        faceData.y = picoFaceData[0][0]
        faceData.x = picoFaceData[0][1]
        faceData.magnitude = picoFaceData[0][2]
        faceData.probability = picoFaceData[0][3]
      }

      const { faceScale } = this.state

      let newFaceScale = faceScale
      let color

      if (faceData.probability > 800) {
        newFaceScale = faceScale * 1.1
        color = 'green'
      }

      if (faceData.probability < 800 && faceData.probability > 600) {
        newFaceScale = faceScale * 1.01
        color = 'orange'
      }

      if (faceData.probability < 600 && faceData.probability > 500) {
        newFaceScale = faceScale * 1.005
        color = 'orange'
      }

      if (faceData.probability < 500 && faceData.probability > 400) {
        newFaceScale = Math.max(faceScale * 0.995, 0.1)
        color = 'red'
      }

      if (faceData.probability < 500 && faceData.probability > 200) {
        newFaceScale = Math.max(faceScale * 0.99, 0.1)
        color = 'red'
      }

      if (faceData.probability < 200) {
        newFaceScale = Math.max(faceScale * 0.98, 0.1)
        color = 'purple'
      }

      this.ctx.beginPath();
      this.ctx.arc(faceData.x, faceData.y, faceData.magnitude, 0, 2 * Math.PI, false);
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = color;
      this.ctx.stroke();

      this.setState(() => ({ 
        faceData,
        faceScale: newFaceScale,
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
    return (
      <div className="App">
        <header className="App-header" style={{ display: 'flex' }}>
          <canvas 
            ref={ref => this.canvas = ref} 
            width={this.CANVAS_WIDTH}
            height={this.CANVAS_HEIGHT} 
            style={{ display: 'absolute' }}
          />
        </header>
      </div>
    )
  }
}
