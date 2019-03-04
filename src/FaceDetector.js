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
      latestDetectionTimes: {},
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

//move work times back to state for in between schedule work calls

  scheduleWork = (workQueue, latestDetectionTimes, carryOverData) => {
    requestAnimationFrame(() => {
      requestIdleCallback(deadline => {
        for (let i = 0; i < workQueue.length; i++) {
          const { action, tag } = workQueue[i]

          if (latestDetectionTimes[tag] == null) {
            latestDetectionTimes[tag] = 1
          }

          if ((deadline.timeRemaining() * 0.8) < latestDetectionTimes[tag]) {
            Object.keys(latestDetectionTimes).map(key => {
              latestDetectionTimes[key] *= 0.9
            })
            this.scheduleWork(
              workQueue.slice(i), 
              latestDetectionTimes,
              carryOverData
            )
            return
          }

          let data
          const start = performance.now()
          if (i === workQueue.length - 1) {
            action(carryOverData, latestDetectionTimes)
          } else {
            data = action(carryOverData)
          }
          latestDetectionTimes[tag] = performance.now() - start

          carryOverData = null
          if (data != null) carryOverData = data
        }
      })
    })
  } 

  componentDidUpdate() {
    console.log(this.state.latestDetectionTimes)
    if (this.state.detectionActive) {
      const updateCanvas = {
        action: this.updateCanvas,
        tag: 'updateCanvas'
      }

      const getContextData = {
        action: () => this.ctx.getImageData(
          0,
          0, 
          this.state.currentCanvasSizeIndex * 4, 
          this.state.currentCanvasSizeIndex * 3
        ).data,
        tag: 'getContextData'
      }

      const scheduleAndSetState = {
        tag: 'scheduleAndSetState',
        action: (imageData, latestDetectionTimes) => {
          const { 
            newFacesData,
            newFaceScale,
            newCanvasSizeIndex,
            newNoFaceFrames,
            newHighFaceFrames
          } = this.detect(imageData)
  
          this.setState(() => ({ 
            facesData: newFacesData,
            faceScale: newFaceScale,
            currentCanvasSizeIndex: newCanvasSizeIndex,
            noFaceFrames: newNoFaceFrames,
            highFaceFrames: newHighFaceFrames,
            framesSinceUpdate: 0,
            latestDetectionTimes
          }))
        }
      }

      this.scheduleWork([
        updateCanvas, 
        getContextData,
        scheduleAndSetState
      ], this.state.latestDetectionTimes)
    }
  }

  render() {
    const { facesData } = this.state
    const relativeFacesData = facesData.length ? 
      facesData.map(face => this.relativeFaceLocation(face)) :
      [{x: null, y: null, size: null, strength: null}]

    return (
      <div className="App" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 600, height: 450, display: false ? 'none' : 'relative' }}>
          <canvas 
            ref={ref => this.canvas = ref} 
          />
        </div>
        {this.props.children && this.props.children(relativeFacesData)}
      </div>
    )
  }

  relativeFaceLocation = (faceData) => {
    const { currentCanvasSizeIndex: canvasSize } = this.state
    const widthIndex = canvasSize * 4 / 100
    const heightIndex = canvasSize * 3 / 100

    if (faceData && faceData.x) {
      let { x, y, size, strength } = faceData

      size = Math.round(size / widthIndex)
      y = Math.round(y / heightIndex) 
      x = Math.round(x / widthIndex)

      y = y < 50 ? y - (size / 2) : y + (size / 2)
      x = 100 - (x < 50 ? x - (size / 2) : x + (size / 2))

      x = Math.min(Math.max(x, 0), 100)
      y = Math.min(Math.max(y, 0), 100)
      
      strength = Math.round(strength)
      return {x, y, size, strength}
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

      if (newFacesData[0]) {
        newFacesData.map(face => {
          this.ctx.beginPath();
          this.ctx.arc(face.x, face.y, face.size / 2, 0, 2 * Math.PI, false);
          this.ctx.lineWidth = 3;
          this.ctx.strokeStyle = face.strength < 100 ? 'red' : 'aqua';
          this.ctx.stroke();
        })
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



// componentDidUpdate() {
//   if (this.state.detectionActive) {
  
//       const drawStart = performance.now()
//       this.scheduleWork(this.updateCanvas)
//       const drawEnd = performance.now()

//       this.scheduleWork(() => {

//       })

//       const detectionStart = performance.now()
//       const { 
//         newFacesData,
//         newFaceScale,
//         newCanvasSizeIndex,
//         newNoFaceFrames,
//         newHighFaceFrames
//       } = this.detect()
//       const detectionEnd = performance.now()

//       this.setState(() => ({ 
//         facesData: newFacesData,
//         faceScale: newFaceScale,
//         currentCanvasSizeIndex: newCanvasSizeIndex,
//         noFaceFrames: newNoFaceFrames,
//         highFaceFrames: newHighFaceFrames,
//         // detectionTimes: this.updatePerformanceQueue(
//         //   detectionStart, detectionEnd, this.state.detectionTimes
//         // ),
//         // drawTimes: this.updatePerformanceQueue(
//         //   drawStart, drawEnd, this.state.drawTimes
//         // ),
//         framesSinceUpdate: 0
//       }))
//   }
// }


// scheduleWork = work => {
//   const { drawTimes, detectionTimes } = this.state
//   const averageLast5Draws = drawTimes
//     .slice(55)
//     .reduce((a, c) => a + c) / 5

//   const averageLast5Detections = detectionTimes
//     .slice(55)
//     .reduce((a, c) => a + c) / 5

//   work()
//   console.log(averageLast5Detections, averageLast5Detections)
// } 
