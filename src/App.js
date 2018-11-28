import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Input from './Input'
import * as pico from './pico'
import faceFinderBin from './facefinder'


export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = { faceData: [] }
    this.width = 200
    this.height = 150
    this.ctx = null
  }

  draw = () => {
    window.requestAnimationFrame(() => {
      this.ctx = this.canvas.getContext('2d')
      this.ctx.drawImage(this.video,0,0,this.width,this.height)
      const time = Date.now()
			const faceData = pico.processfn(this.ctx)
			console.log(faceData)
      this.setState(() => ({ faceData }))
      console.log('duration: ', Date.now() - time)
      console.log(this.state.faceData)
    })
  }

  async componentDidMount() {
    const stream = await navigator
      .mediaDevices.getUserMedia({ video: true, audio: false })

    this.video.srcObject = stream
		this.video.play()
		
		pico.picoInit()

    setInterval(() => this.draw(), 50)
  }

  render() {
    return (
      <div className="App">
        <header className="App-header" style={{ display: 'flex' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4>{typeof this.state.faceData[0]}</h4>
          </div>
          <video ref={ref => this.video = ref} style={{ width: this.width, height: this.height }} />
          <canvas ref={ref => this.canvas = ref} width={this.width} height={this.height} style={{ background: 'green' }} />
        </header>
      </div>
    )
  }
}
