import React, { Component } from 'react';
import * as pico from './pico'

export default class FaceDetector extends Component {
  constructor(props) {
    super(props)

    this.ctx = null
    this.imageData = null
    this.video = document.createElement("video")
    this.baseFaceSize = 100

    this.workQueue = []
    this.taskTimes = {}
    this.carryOverData = null

    this.state = { 
      currentCanvasSizeIndex: 100,
      facesData: {},
      faceScale: 1, 
      first: null,
      height: this.maxHeight,
      noFaceFrames: 0,
      highFaceFrames: 0,
      framesSinceUpdate: 0,
    }
  }

  async componentDidMount() {
    const stream = await navigator
      .mediaDevices.getUserMedia({ video: true, audio: false })

    this.video.srcObject = stream
    this.video.play()
    this.ctx = this.canvas.getContext('2d', { alpha: false })
		
    pico.picoInit()

    if (this.props.active) {
      this.newWorkQueue()
      this.detectionLoop()
    }
  }

  componentDidUpdate() {
    if (this.props.active && !this.workQueue.length) {
      this.newWorkQueue()
    }
  }

  render() {
    const { facesData } = this.state
    const relativeFacesData = facesData.length ? 
      facesData.map(face => this.relativeFaceLocation(face)) :
      [{x: null, y: null, size: null, strength: null}]

    return (
      <React.Fragment>
        <canvas 
          ref={ref => this.canvas = ref} 
          style={{ display: this.props.showCanvas ? 'inline' : 'none' }} 
        />
        {this.props.children && this.props.children(relativeFacesData)}
      </React.Fragment>
    )
  }

  performPartialWork = () => {
    if (!this.workQueue.length) return
    const firstTask = this.workQueue.shift()

    const taskStartTime = performance.now()
    this.carryOverData = firstTask.action(this.carryOverData)
    this.taskTimes[firstTask.tag] = performance.now() - taskStartTime

    if (!this.workQueue.length) return

    requestIdleCallback(deadline => {
      if (!this.taskTimes[this.workQueue[0].tag]) this.taskTimes[this.workQueue[0].tag] = 1
      if (this.taskTimes[this.workQueue[0].tag] < deadline.timeRemaining() * 0.9) {
        this.performPartialWork()
      }
    })
  }

  detectionLoop = () => {
    this.performPartialWork()
    requestAnimationFrame(this.detectionLoop)
  }

  newWorkQueue() {
    this.workQueue = [
      {
        action: this.updateCanvas,
        tag: 'updateCanvas'
      },
      {
        action: () => { 
          this.imageData = this.ctx.getImageData(
            0,
            0, 
            this.state.currentCanvasSizeIndex * 4, 
            this.state.currentCanvasSizeIndex * 3
          ).data
        },
        tag: 'getContextData'
      },
      {
        tag: 'detectAndSetState',
        action: () => {
          const { 
            newFacesData,
            newFaceScale,
            newCanvasSizeIndex,
            newNoFaceFrames,
            newHighFaceFrames
          } = this.detect(this.imageData)
  
          this.setState(() => ({ 
            facesData: newFacesData[0] ? newFacesData : this.state.facesData,
            faceScale: newFaceScale,
            currentCanvasSizeIndex: newCanvasSizeIndex,
            noFaceFrames: newNoFaceFrames,
            highFaceFrames: newHighFaceFrames,
            framesSinceUpdate: 0
          }))
        }
      }
    ]
  }

  relativeFaceLocation = (faceData) => {
    const { currentCanvasSizeIndex: canvasSize } = this.state
    const widthIndex = canvasSize * 4 / 100
    const heightIndex = canvasSize * 3 / 100

    if (faceData && faceData.x) {
      let { x, y, size, strength } = faceData

      size = Math.round(size / widthIndex)
      y = Math.round(y / heightIndex) 
      x = 100 - Math.round(x / widthIndex)

      x = Math.min(Math.max(x, 0), 100)
      y = Math.min(Math.max(y, 0), 100)
      
      strength = Math.round(strength)
      return {x, y, size, strength}
    } 
  }

  calculateFaceSizeScale = detectionStrength => {
    const s = detectionStrength

    if (s > 1000) {
        return 1.2
    } else if (s < 1000 && s > 900) {
        return 1.1
    } else if (s < 900 && s > 800) {
        return 1.075
    } else if (s < 800 && s > 700) {
        return 1.05
    } else if (s < 700 && s > 600) {
        return 1.03
    } else if (s < 600 && s > 500) {
        return 1.01
    } else if (s < 500 && s > 400) {
        return 1.005
    } else if (s < 400 && s > 300) {
        return 0.995 
    } else if (s < 300 && s > 200) {
        return 0.99 
    } else if (s < 200 && s > 100) {
        return 0.95 
    } else if (s < 100 && s > 50) {
        return 0.9 
    } else {
        return 0.8
    } 
}

  updatePerformanceQueue = (detectionStart, detectionEnd, queue) => {
    queue.push(detectionEnd - detectionStart)
    if (queue.length > 60) queue.shift()

    return queue
  }

  updateCanvas = () => {
    const width = this.state.currentCanvasSizeIndex * 4
    const height = this.state.currentCanvasSizeIndex * 3
    this.canvas.width = Math.floor(width)
    this.canvas.height = Math.floor(height)
    this.ctx.drawImage(this.video, 0, 0, width, height)

    if (this.state.facesData[0]) {
      this.state.facesData.map(face => {
        this.ctx.beginPath();
        this.ctx.arc(face.x, face.y, face.size / 2, 0, 2 * Math.PI, false);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = face.strength < 100 ? 'red' : 'aqua';
        this.ctx.stroke();
      })
    }
  }

  detect = (imageData = 1) => {
      const detectedFacesData = pico.processfn(
        imageData, 
        this.baseFaceSize * this.state.faceScale,
        this.state.currentCanvasSizeIndex * 3,
        this.state.currentCanvasSizeIndex * 4
      ).filter(face => face[3] > 20)

      let newFacesData = []
      let bestDetectionData = [0, 0]

      if (detectedFacesData.length) {
        detectedFacesData.map((detectedFaceData, index) => {
          const newFaceData = {}
          const [y, x, size, strength] = detectedFaceData

          newFaceData.y = y
          newFaceData.x = x
          newFaceData.size = size
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
      let newFaceScale = Math.max(this.calculateFaceSizeScale(bestDetection), 0.01) 
        || faceScale

      if (bestDetection > 250) {
        if (newHighFaceFrames < 1) {
          newHighFaceFrames = newHighFaceFrames + 1
        } else {
          newCanvasSizeIndex = newCanvasSizeIndex - 2
          newHighFaceFrames = 0
        }
      } else {
        newHighFaceFrames = 0
      }

      if (!newFacesData.length) {
          if (newNoFaceFrames < 1) {
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
      
      return { 
        newFacesData,
        newFaceScale,
        newCanvasSizeIndex,
        newNoFaceFrames,
        newHighFaceFrames
      }
  }
}

FaceDetector.defaultProps = { 
  active: true,
  showCanvas: false 
}