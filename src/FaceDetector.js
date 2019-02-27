import React, { Component } from 'react';
import * as pico from './pico'
import calculateFaceSizeScale from './calculateFaceSizeScale'

export default class FaceDetector extends Component {
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
      drawTimes: new Array(60).fill(0),
      framesSinceUpdate: 0
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
      window.requestIdleCallback(() => {
        this.updateCanvas()

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
      window.requestIdleCallback(deadline => {

        if (!this.shouldSplitRender(deadline.timeRemaining())) {
          const drawStart = performance.now()
          this.updateCanvas()
          const drawEnd = performance.now()
          window.requestIdleCallback(() => {
            const detectionStart = performance.now()
            const { 
              newFacesData,
              newFaceScale,
              newCanvasSizeIndex,
              newNoFaceFrames,
              newHighFaceFrames
            } = this.detect()

            const detectionEnd = performance.now()
    
            requestIdleCallback(deadline =>
              this.setState(() => ({ 
                facesData: newFacesData,
                faceScale: newFaceScale,
                currentCanvasSizeIndex: newCanvasSizeIndex,
                noFaceFrames: newNoFaceFrames,
                highFaceFrames: newHighFaceFrames,
                detectionTimes: this.updatePerformanceQueue(
                  detectionStart, detectionEnd, this.state.detectionTimes
                ),
                drawTimes: this.updatePerformanceQueue(
                  drawStart, drawEnd, this.state.drawTimes
                ),
                framesSinceUpdate: 0
              }))
            )

            return
          })
        }

        const drawStart = performance.now()
        this.updateCanvas()
        const drawEnd = performance.now()

        const detectionStart = performance.now()
        const { 
          newFacesData,
          newFaceScale,
          newCanvasSizeIndex,
          newNoFaceFrames,
          newHighFaceFrames
        } = this.detect()
        const detectionEnd = performance.now()

        requestAnimationFrame(() =>
          this.setState(() => ({ 
            facesData: newFacesData,
            faceScale: newFaceScale,
            currentCanvasSizeIndex: newCanvasSizeIndex,
            noFaceFrames: newNoFaceFrames,
            highFaceFrames: newHighFaceFrames,
            detectionTimes: this.updatePerformanceQueue(
              detectionStart, detectionEnd, this.state.detectionTimes
            ),
            drawTimes: this.updatePerformanceQueue(
              drawStart, drawEnd, this.state.drawTimes
            ),
            framesSinceUpdate: 0,
          }))
        )
      })
    }
  }

  render() {
    const detections = this.state.detectionTimes.reduce((acc, n) => acc + n) / 60
    const draws = this.state.drawTimes.reduce((acc, n) => acc + n) / 60

    return (
      <div className="App" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 600, height: 450 }}>
          <canvas 
            ref={ref => this.canvas = ref} 
          />
        </div>
        <h1>{draws.toFixed(1) + ' ' + detections.toFixed(1) + ' ' + (draws + detections).toFixed(1)}</h1>
      </div>
    )
  }

  updatePerformanceQueue = (detectionStart, detectionEnd, queue) => {
    queue.push(detectionEnd - detectionStart)
    if (queue.length > 60) queue.shift()

    return queue
  }

  shouldSplitRender = timeRemaining => {
    const { drawTimes, detectionTimes } = this.state
    const averageLast5Draws = drawTimes
      .slice(55)
      .reduce((a, c) => a + c) / 5

    const averageLast5Detections = detectionTimes
      .slice(55)
      .reduce((a, c) => a + c) / 5

    return (averageLast5Draws + averageLast5Detections) < timeRemaining
  } 

  updateCanvas = () => {
    const width = this.state.currentCanvasSizeIndex * 4
    const height = this.state.currentCanvasSizeIndex * 3
    this.canvas.width = Math.floor(width)
    this.canvas.height = Math.floor(height)
    this.ctx.drawImage(this.video, 0, 0, width, height)
  }

  detect = () => {
      const detectedFacesData = pico.processfn(
        this.ctx, 
        this.baseFaceSize * this.state.faceScale,
        this.state.currentCanvasSizeIndex * 3,
        this.state.currentCanvasSizeIndex * 4
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

      if (bestDetection > 250) {
        if (newHighFaceFrames < 5) {
          newHighFaceFrames = newHighFaceFrames + 1
        } else {
          newCanvasSizeIndex = newCanvasSizeIndex - 2
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
}
