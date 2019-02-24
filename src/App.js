import React, { Component } from 'react';
import * as pico from './pico'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      faceData: {}, 
      first: null,
      resolution: 1,
      width: 0,
      height: 0
    }

    this.ctx = null
    this.video = document.createElement("video")
    this.maxWidth = 800
    this.maxHeight = 600
  }

  draw = () => {
    window.requestAnimationFrame(() => {
      this.ctx = this.canvas.getContext('2d')
      this.ctx.drawImage(
        this.video,
        0,
        0,
        this.state.width || this.maxWidth,
        this.state.height || this.maxHeight
      )

      const picoFaceData = pico.processfn(this.ctx)
      let faceData = {}

      if (picoFaceData[0] && picoFaceData[0][0]) {
        faceData.top = picoFaceData[0][0]
        faceData.left = picoFaceData[0][1]
        faceData.magnitude = picoFaceData[0][2]
        faceData.probability = picoFaceData[0][3]
      }

      if (faceData.probability > 400) {
        this.ctx.beginPath();
        this.ctx.arc(faceData.left, faceData.top, faceData.magnitude / 2, 0, 2*Math.PI, false);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'red';
        this.ctx.stroke();
      }



      this.setState(() => ({ 
        faceData,
        width: this.maxWidth * this.state.resolution,
        height: this.maxHeight * this.state.resolution
      }))
    })
  }

  mapFaceLocation = (left, top) => {
    const widthPercent = this.width / 100
    const heightPercent = this.height / 100

    const leftPercent =  100 - (left / widthPercent)
    const topPercent = top / heightPercent


  }

  async componentDidMount() {
    const stream = await navigator
      .mediaDevices.getUserMedia({ video: true, audio: false })

    this.video.srcObject = stream
		this.video.play()
		
		pico.picoInit()

    setInterval(() => this.draw(), 20)
  }

  render() {
     const magnitude = this.state.faceData.magnitude ? this.state.faceData.magnitude : 50
     const left = this.state.faceData.left ? this.state.faceData.left : 50
     const top = this.state.faceData.top ? this.state.faceData.top : 50

    return (
      <div className="App">
        <header className="App-header" style={{ display: 'flex' }}>
          <div style={{ background: 'white', height: 200, width: 200 }}>
            <div style={{ 
              background: 'coral', 
              height: magnitude, 
              width: magnitude, 
              borderRadius: magnitude / 2, 
              marginLeft: left, 
              marginTop: top 
            }}></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4>{this.state.faceData.top}</h4>
            <h4>{this.state.faceData.left}</h4>
            <h4>{this.state.faceData.magnitude}</h4>
            <h4>{this.state.faceData.probability}</h4>
          </div>
          <canvas 
            ref={ref => this.canvas = ref} 
            width={this.state.width}
            height={this.state.height} 
          />
        </header>
      </div>
    )
  }
}
