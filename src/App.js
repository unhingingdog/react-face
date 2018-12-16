import React, { Component } from 'react';
import './App.css';
import * as pico from './pico'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = { faceData: [], first: null }
    this.width = 200 * 1.7
    this.height = 150 * 1.7
    this.ctx = null
    this.video = document.createElement("video")
    this.speeds = '0'.repeat(101).split('').map(nada => 8)
  }

  draw = () => {
    window.requestAnimationFrame(() => {
      this.ctx = this.canvas.getContext('2d')
      this.ctx.drawImage(this.video,0,0,this.width,this.height)

      const time = Date.now()

      const picoFaceData = pico.processfn(this.ctx)
      let faceData = {}

      if (picoFaceData[0] && picoFaceData[0][0]) {
        faceData.first = picoFaceData[0][0]
        faceData.second = picoFaceData[0][1]
        faceData.third = picoFaceData[0][2]
        faceData.fourth = picoFaceData[0][3]
      }

      this.setState(() => ({ faceData }))

      if (faceData[0]) this.speeds.push(Date.now() - time)
    })
  }

  async componentDidMount() {
    const stream = await navigator
      .mediaDevices.getUserMedia({ video: true, audio: false })

    this.video.srcObject = stream
		this.video.play()
		
		pico.picoInit()

    setInterval(() => this.draw(), 2000)
  }

  render() {
    return (
      <div className="App">
        <header className="App-header" style={{ display: 'flex' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4>{this.state.faceData.first}</h4>
            <h4>{this.state.faceData.second}</h4>
            <h4>{this.state.faceData.third}</h4>
            <h4>{this.state.faceData.fourth}</h4>
            <h4>{this.speeds.slice(this.speeds.length - 100).reduce((acc, curr) => acc + curr, 0) / 100} / {this.speeds.length}</h4>
          </div>
          <canvas ref={ref => this.canvas = ref} width={this.width} height={this.height} style={{ background: 'green', display: 'none' }} />
        </header>
      </div>
    )
  }
}
