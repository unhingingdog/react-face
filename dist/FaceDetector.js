import _regeneratorRuntime from "@babel/runtime/regenerator";
import _asyncToGenerator from "@babel/runtime/helpers/esm/asyncToGenerator";
import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime/helpers/esm/createClass";
import _possibleConstructorReturn from "@babel/runtime/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime/helpers/esm/getPrototypeOf";
import _inherits from "@babel/runtime/helpers/esm/inherits";
import React, { Component } from 'react';
import * as pico from './pico';

var FaceDetector =
/*#__PURE__*/
function (_Component) {
  _inherits(FaceDetector, _Component);

  function FaceDetector(props) {
    var _this;

    _classCallCheck(this, FaceDetector);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(FaceDetector).call(this, props));

    _this.performPartialWork = function () {
      if (!_this.workQueue.length) return;

      var firstTask = _this.workQueue.shift();

      var taskStartTime = performance.now();
      _this.carryOverData = firstTask.action(_this.carryOverData);
      _this.taskTimes[firstTask.tag] = performance.now() - taskStartTime;
      if (!_this.workQueue.length) return;
      requestIdleCallback(function (deadline) {
        if (!_this.taskTimes[_this.workQueue[0].tag]) _this.taskTimes[_this.workQueue[0].tag] = 1;

        if (_this.taskTimes[_this.workQueue[0].tag] < deadline.timeRemaining() * 0.9) {
          _this.performPartialWork();
        }
      });
    };

    _this.detectionLoop = function () {
      _this.performPartialWork();

      requestAnimationFrame(_this.detectionLoop);
    };

    _this.relativeFaceLocation = function (faceData) {
      var canvasSize = _this.state.currentCanvasSizeIndex;
      var widthIndex = canvasSize * 4 / 100;
      var heightIndex = canvasSize * 3 / 100;

      if (faceData && faceData.x) {
        var x = faceData.x,
            y = faceData.y,
            size = faceData.size,
            strength = faceData.strength;
        size = Math.round(size / widthIndex);
        y = Math.round(y / heightIndex);
        x = 100 - Math.round(x / widthIndex);
        x = Math.min(Math.max(x, 0), 100);
        y = Math.min(Math.max(y, 0), 100);
        strength = Math.round(strength);
        return {
          x: x,
          y: y,
          size: size,
          strength: strength
        };
      }
    };

    _this.calculateFaceSizeScale = function (detectionStrength) {
      var s = detectionStrength;

      if (s > 1000) {
        return 1.2;
      } else if (s < 1000 && s > 900) {
        return 1.1;
      } else if (s < 900 && s > 800) {
        return 1.075;
      } else if (s < 800 && s > 700) {
        return 1.05;
      } else if (s < 700 && s > 600) {
        return 1.03;
      } else if (s < 600 && s > 500) {
        return 1.01;
      } else if (s < 500 && s > 400) {
        return 1.005;
      } else if (s < 400 && s > 300) {
        return 0.995;
      } else if (s < 300 && s > 200) {
        return 0.99;
      } else if (s < 200 && s > 100) {
        return 0.95;
      } else if (s < 100 && s > 50) {
        return 0.9;
      } else {
        return 0.8;
      }
    };

    _this.updatePerformanceQueue = function (detectionStart, detectionEnd, queue) {
      queue.push(detectionEnd - detectionStart);
      if (queue.length > 60) queue.shift();
      return queue;
    };

    _this.updateCanvas = function () {
      var width = _this.state.currentCanvasSizeIndex * 4;
      var height = _this.state.currentCanvasSizeIndex * 3;
      _this.canvas.width = Math.floor(width);
      _this.canvas.height = Math.floor(height);

      _this.ctx.drawImage(_this.video, 0, 0, width, height);

      if (_this.state.facesData[0]) {
        _this.state.facesData.map(function (face) {
          _this.ctx.beginPath();

          _this.ctx.arc(face.x, face.y, face.size / 2, 0, 2 * Math.PI, false);

          _this.ctx.lineWidth = 3;
          _this.ctx.strokeStyle = face.strength < 100 ? 'red' : 'aqua';

          _this.ctx.stroke();
        });
      }
    };

    _this.detect = function () {
      var imageData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var detectedFacesData = pico.processfn(imageData, _this.baseFaceSize * _this.state.faceScale, _this.state.currentCanvasSizeIndex * 3, _this.state.currentCanvasSizeIndex * 4).filter(function (face) {
        return face[3] > 20;
      });
      var newFacesData = [];
      var bestDetectionData = [0, 0];

      if (detectedFacesData.length) {
        detectedFacesData.map(function (detectedFaceData, index) {
          var newFaceData = {};

          var _detectedFaceData = _slicedToArray(detectedFaceData, 4),
              y = _detectedFaceData[0],
              x = _detectedFaceData[1],
              size = _detectedFaceData[2],
              strength = _detectedFaceData[3];

          newFaceData.y = y;
          newFaceData.x = x;
          newFaceData.size = size;
          newFaceData.strength = strength;

          if (bestDetectionData[0] < strength) {
            bestDetectionData = [strength, index];
          }

          newFacesData.push(newFaceData);
        });
      }

      var _this$state = _this.state,
          faceScale = _this$state.faceScale,
          currentCanvasSizeIndex = _this$state.currentCanvasSizeIndex,
          noFaceFrames = _this$state.noFaceFrames,
          highFaceFrames = _this$state.highFaceFrames;
      var newCanvasSizeIndex = currentCanvasSizeIndex;
      var newNoFaceFrames = noFaceFrames;
      var newHighFaceFrames = highFaceFrames;

      var _bestDetectionData = bestDetectionData,
          _bestDetectionData2 = _slicedToArray(_bestDetectionData, 1),
          bestDetection = _bestDetectionData2[0];

      var newFaceScale = Math.max(_this.calculateFaceSizeScale(bestDetection), 0.01) || faceScale;

      if (bestDetection > 250) {
        if (newHighFaceFrames < 1) {
          newHighFaceFrames = newHighFaceFrames + 1;
        } else {
          newCanvasSizeIndex = newCanvasSizeIndex - 2;
          newHighFaceFrames = 0;
        }
      } else {
        newHighFaceFrames = 0;
      }

      if (!newFacesData.length) {
        if (newNoFaceFrames < 1) {
          newNoFaceFrames = newNoFaceFrames + 1;
        } else {
          newCanvasSizeIndex = Math.min(newCanvasSizeIndex + 2, 200);
          newNoFaceFrames = 0;
        }
      } else {
        newNoFaceFrames = 0;
      }

      return {
        newFacesData: newFacesData,
        newFaceScale: newFaceScale,
        newCanvasSizeIndex: newCanvasSizeIndex,
        newNoFaceFrames: newNoFaceFrames,
        newHighFaceFrames: newHighFaceFrames
      };
    };

    _this.ctx = null;
    _this.imageData = null;
    _this.video = document.createElement("video");
    _this.baseFaceSize = 100;
    _this.workQueue = [];
    _this.taskTimes = {};
    _this.carryOverData = null;
    _this.state = {
      currentCanvasSizeIndex: 100,
      facesData: {},
      faceScale: 1,
      first: null,
      height: _this.maxHeight,
      noFaceFrames: 0,
      highFaceFrames: 0,
      framesSinceUpdate: 0
    };
    return _this;
  }

  _createClass(FaceDetector, [{
    key: "componentDidMount",
    value: function () {
      var _componentDidMount = _asyncToGenerator(
      /*#__PURE__*/
      _regeneratorRuntime.mark(function _callee() {
        var stream;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return navigator.mediaDevices.getUserMedia({
                  video: true,
                  audio: false
                });

              case 2:
                stream = _context.sent;
                this.video.srcObject = stream;
                this.video.play();
                this.ctx = this.canvas.getContext('2d', {
                  alpha: false
                });
                pico.picoInit();

                if (this.props.active) {
                  this.newWorkQueue();
                  this.detectionLoop();
                }

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function componentDidMount() {
        return _componentDidMount.apply(this, arguments);
      }

      return componentDidMount;
    }()
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      if (this.props.active && !this.workQueue.length) {
        this.newWorkQueue();
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var facesData = this.state.facesData;
      var relativeFacesData = facesData.length ? facesData.map(function (face) {
        return _this2.relativeFaceLocation(face);
      }) : [{
        x: null,
        y: null,
        size: null,
        strength: null
      }];
      return React.createElement(React.Fragment, null, React.createElement("canvas", {
        ref: function ref(_ref) {
          return _this2.canvas = _ref;
        },
        style: {
          display: this.props.showCanvas ? 'inline' : 'none'
        }
      }), this.props.children && this.props.children(relativeFacesData));
    }
  }, {
    key: "newWorkQueue",
    value: function newWorkQueue() {
      var _this3 = this;

      this.workQueue = [{
        action: this.updateCanvas,
        tag: 'updateCanvas'
      }, {
        action: function action() {
          _this3.imageData = _this3.ctx.getImageData(0, 0, _this3.state.currentCanvasSizeIndex * 4, _this3.state.currentCanvasSizeIndex * 3).data;
        },
        tag: 'getContextData'
      }, {
        tag: 'detectAndSetState',
        action: function action() {
          var _this3$detect = _this3.detect(_this3.imageData),
              newFacesData = _this3$detect.newFacesData,
              newFaceScale = _this3$detect.newFaceScale,
              newCanvasSizeIndex = _this3$detect.newCanvasSizeIndex,
              newNoFaceFrames = _this3$detect.newNoFaceFrames,
              newHighFaceFrames = _this3$detect.newHighFaceFrames;

          _this3.setState(function () {
            return {
              facesData: newFacesData[0] ? newFacesData : _this3.state.facesData,
              faceScale: newFaceScale,
              currentCanvasSizeIndex: newCanvasSizeIndex,
              noFaceFrames: newNoFaceFrames,
              highFaceFrames: newHighFaceFrames,
              framesSinceUpdate: 0
            };
          });
        }
      }];
    }
  }]);

  return FaceDetector;
}(Component);

export { FaceDetector as default };
FaceDetector.defaultProps = {
  active: true,
  showCanvas: false
};