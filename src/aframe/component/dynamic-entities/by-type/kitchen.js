'use strict';

// dependencies

import generateNormals from '../../../../utils/data3d/buffer/get-normals'
import generateUvs from '../../../../utils/data3d/buffer/get-uvs'
import loadData3d from '../../../../utils/data3d/load'
/*
TODO: add external asset loading

var s3 = require('s3')
var _ = require('underscore')
var resolve = require('_utils/data3d/resolve')
var flatten = require('_utils/data3d/flatten')
var round = require('round')

var meshes = {
  singleSink: '/535e624259ee6b0200000484/170429-0355-60hukz/bf4e4a56-ed95-4b58-a214-4b1a0a84ae0e.gz.data3d.buffer',
  doubleSink: '/535e624259ee6b0200000484/170429-2156-7ufbnv/df481313-8fb4-48da-bc28-0369b08a2c6a.gz.data3d.buffer',
  gas60: '/535e624259ee6b0200000484/170428-2318-1ayck9/ece0ead0-d27f-4cf9-b137-2021f25ad4ee.gz.data3d.buffer',
  gas90: '/535e624259ee6b0200000484/170429-0114-jxswhr/523bb9dc-0103-4c93-aba8-ad0882123550.gz.data3d.buffer',
  fridge: '/535e624259ee6b0200000484/170429-1020-5zimgz/4cec6215-9d5c-4f38-b714-e62fdab6d892.gz.data3d.buffer'
}
*/
var elements = [], remainder, elementNum

// class

export default {

  params: {

    type: 'kitchen',
    v: 2,        // version

    x: 0,
    y: 0,
    z: 0,
    ry: 0,

    lock: false,

    bake: true,
    bakeStatus: 'none', // none, pending, done

    // Geometry params
    l: 4.2,      // length
    w: 0.6,      // width (=thickness)
    h: 2.4,      // height
    baseBoard: 0.1,
    doorWidth: 0.02,
    counterHeight: 0.9,
    wallCabinetHeight: 1.5,
    wallCabinetWidth: 0.45,
    counterThickness: 0.03,
    barCounter: false,
    highCabinetLeft: 2,
    highCabinetRight: 0,
    elementLength: 0.6,
    cooktopType: 'none',
    fridge: false,
    fridgePos: 1,
    microwave: false,
    microwavePos: 1,
    sinkType: 'none',
    extractorType: 'none',
    ovenType: 'none',
    cabinetType: 'flat',
    cooktopPos: 6,
    ovenPos: 6,
    sinkPos: 4,
    wallCabinet: true,

    // materials
    materials: {
      kitchen: 'cabinet_paint_white',
      counter: 'cabinet_paint_white',
      tab: 'chrome',
      oven: 'oven_miele_60-60',
      cooktop: 'cooktop_westinghouse_60',
      microwave: 'microwave_samsung'
    }
  },

  valid: {
    children: [],
    x: {
      step: 0.05
    },
    y: {
      step: 0.05
    },
    z: {
      step: 0.05
    },
    ry: {
      snap: 45
    },
    l: {
      min: 0.6,
      //max: 4,
      step: 0.05
    }
  },

  initialize: function(){
    // backwards compatibility
    if (this.a.kitchenMaterial) {
      this.a.materials.kitchen = this.a.kitchenMaterial
      delete this.a.kitchenMaterial
    }
    if (this.a.counterMaterial) {
      this.a.materials.counter = this.a.counterMaterial
      delete this.a.counterMaterial
    }
    if (this.a.tabMaterial) {
      this.a.materials.tab = this.a.tabMaterial
      delete this.a.tabMaterial
    }
    if (this.a.ovenMaterial) {
      this.a.materials.oven = this.a.ovenMaterial
      delete this.a.ovenMaterial
    }

    // on the fly migration for version one kitchens

    if (!this.a.v || this.a.v === 1) {
      try {
        // new parameters
        this.a.cooktopType = this.a.cooktop ? 'electro60' : 'none'
        delete this.a.cooktop
        this.a.sinkType = this.a.sink ? 'single' : 'none'
        delete this.a.sink
        this.a.ovenType = !this.a.oven ? 'none' : this.a.ovenNum === 1 ? 'single' : 'double'
        delete this.a.oven
        delete this.a.ovenNum
        this.a.extractorType = this.a.extractor ? 'integrated' : 'none'
        delete this.a.extractor
        this.a.fridge = false
        this.a.cabinetType = this.a.cabinetFrame ? 'style1' : 'flat'
        delete this.a.cabinetFrame
      } catch(err) { console.warn(err) }

      if (this.a.sinkPos === this.a.cooktopPos) this.a.sinkType = 'none'

      var oldElCount = Math.round(this.a.l / this.a.elementLength)
      if (this.a.ovenPos <= 0 || this.a.ovenPos > oldElCount) this.a.ovenType = 'none'
      if (this.a.sinkPos <= this.a.highCabinetLeft || this.a.sinkPos > oldElCount - this.a.highCabinetRight) this.a.sinkType = 'none'
      if (this.a.cooktopPos <= this.a.highCabinetLeft || this.a.cooktopPos > oldElCount - this.a.highCabinetRight) this.a.cooktopType = 'none'

      // new materials
      this.a.materials.oven = 'oven_miele_60-60'
      this.a.materials.cooktop = 'cooktop_westinghouse_60'
      this.a.materials.microwave = 'microwave_samsung'

      // set new version
      this.a.v = 2
    }

  },

  bindings: [{
    events: [
      'change:l',
      'change:w',
      'change:h',
      'change:baseBoard',
      'change:doorWidth',
      'change:highCabinetLeft',
      'change:highCabinetRight',
      'change:ovenPos',
      'change:ovenType',
      'change:sinkPos',
      'change:sinkType',
      'change:cooktopPos',
      'change:cooktopType',
      'change:fridge',
      'change:fridgePos',
      'change:microwave',
      'change:microwavePos',
      'change:wallCabinet',
      'change:counterThickness',
      'change:barCounter',
      'change:tabMaterial',
      'change:ovenMaterial',
      'change:counterMaterial',
      'change:kitchenMaterial',
      'change:cabinetType',
      'change:extractorType'
    ],
    call: 'meshes3d'
  },{
    events: [
      'change:l',
      'change:w',
      'change:h',
      'change:highCabinetLeft',
      'change:highCabinetRight',
      'change:ovenPos',
      'change:ovenType',
      'change:sinkPos',
      'change:sinkType',
      'change:cooktopPos',
      'change:cooktopType',
      'change:fridge',
      'change:fridgePos',
      'change:microwave',
      'change:microwavePos',
      'change:wallCabinet',
    ],
    call: 'contextMenu'
  },{
    events: ['change:materials.*'],
    call: 'materials3d'
  }],

  contextMenu: function generateContextMenu () {
    var contextMenu = {
      templateId: 'generic',
      templateOptions: {
        title: 'Kitchen'
      },
      controls: [
        {
          type: 'html',
          display: '<h2>Dimensions<h2>'
        },
        {
          title: 'Height',
          type: 'number',
          param: 'h',
          unit: 'm',
          min: 1,
          max: 4.5,
          step: 0.05,
          round: 0.01,
        },
        {
          title: 'Length',
          type: 'number',
          param: 'l',
          unit: 'm',
          step: 0.05,
          round: 0.01
        },
        {
          title: 'Width',
          type: 'number',
          param: 'w',
          unit: 'm',
          min: 0.35,
          max: 1.0,
          step: 0.05,
          round: 0.01
        },
        {
          title: 'Vertical Position',
          type: 'number',
          param: 'y',
          unit: 'm',
          step: 0.1,
          round: 0.01
        },
        {
          type: 'html',
          display: '<h2>Cabinets & Counter<h2>'
        },
        {
          title: 'High Cabinet Left',
          type: 'number',
          param: 'highCabinetLeft',
          min: 0,
          max: 3,
          step: 1
        },
        {
          title: 'High Cabinet Right',
          type: 'number',
          param: 'highCabinetRight',
          min: 0,
          max: 3,
          step: 1
        },
        {
          title: 'Wall Cabinet',
          type: 'boolean',
          param: 'wallCabinet',
        },
        {
          title: 'Cabinet',
          type: 'list',
          param: 'cabinetType',
          list: {
            'Flat': 'flat',
            'Style 1': 'style1',
            'Style 2': 'style2'
          }
        },
        {
          title: 'Counter Thickness',
          type: 'number',
          param: 'counterThickness',
          unit: 'm',
          min: 0.01,
          max: 0.06,
          step: 0.01,
          round: 0.001
        },
        {
          type: 'html',
          display: '<h2>Configuration<h2>'
        },
        {
          title: 'Cooktop',
          type: 'list',
          param: 'cooktopType',
          list: {
            'Electronic 60': 'electro60',
            'Electronic 90': 'electro90',
            'Gas 60': 'gas60',
            'Gas 90': 'gas90',
            'None': 'none'
          }
        },
        {
          title: 'Oven',
          type: 'list',
          param: 'ovenType',
          list: {
            'Single': 'single',
            'Double': 'double',
            'None': 'none'
          }
        },
        {
          title: 'Sink',
          type: 'list',
          param: 'sinkType',
          list: {
            'Single': 'single',
            'Double': 'double',
            'None': 'none'
          }
        },
        {
          title: 'Large fridge',
          type: 'boolean',
          param: 'fridge',
        },
        {
          title: 'Microwave',
          type: 'boolean',
          param: 'microwave'
        },
        {
          title: 'Lock this item',
          type: 'boolean',
          param: 'locked',
          subscriptions: ['pro', 'modeller', 'artist3d']
        },
        {
          type: 'html',
          display: '<h2>Materials<h2>'
        },
        {
          title: 'Cabinet',
          type: 'material',
          param: 'materials.kitchen',
          category: 'cabinet'
        },
        {
          title: 'Counter',
          type: 'material',
          param: 'materials.counter',
          category: 'counter'
        }
      ]
    }
    var self = this

    elementNum = getElCount(this.a).elementNum
    remainder = getElCount(this.a).remainder
    elements = updatePositions(this.a, {elementNum: elementNum, remainder: remainder})

    var
      cLeft = this.a.highCabinetLeft,
      cRight = elementNum - this.a.highCabinetRight,
      visible = {
        sink: this.a.sinkType !== 'none',
        oven: this.a.ovenType !== 'none',
        cooktop: this.a.cooktopType !== 'none',
        fridge: this.a.fridge
      },
      pos

    if (!this.a.highCabinetLeft && !this.a.highCabinetLeft) {
      pos = findParam('counterThickness')
      contextMenu.controls.splice(pos + 1, 0,
        {
          title: 'Bar counter',
          type: 'boolean',
          param: 'barCounter'
        })
    }
    if (this.a.cooktopType !== 'none') {
      pos = findParam('cooktopType')
      genKitchenMenu('Cooktop', 'cooktopPos', 'sink', false, true, pos)
      contextMenu.controls.splice(pos + elements.length + 2, 0,
        {
          title: 'Extractor',
          type: 'list',
          param: 'extractorType',
          list: {
            'Box': 'box',
            'Pyramid': 'pyramid',
            'Integrated': 'integrated',
            'None': 'none'
          }
        })
    }
    if (this.a.ovenType !== 'none') {
      pos = findParam('ovenType')
      genKitchenMenu('Oven', 'ovenPos', 'sink', true, true, pos)
    }
    if (this.a.sinkType !== 'none') {
      pos = findParam('sinkType')
      genKitchenMenu('Sink', 'sinkPos', 'cooktop', false, true, pos)
    }
    if (this.a.fridge) {
      pos = findParam('fridge')
      genKitchenMenu('Fridge', 'fridgePos', false, true, false, pos)
    }
    if (this.a.microwave) {
      pos = findParam('microwave')
      genKitchenMenu('Microwave', 'microwavePos', 'fridge', true, true, pos)
    }
    /*
    var largeCooktop = this.a.cooktopType !== 'none' && this.a.cooktopType.slice(-2) === '90'
    if (this.a.oven !== 'none') {
      contextMenu.controls.push(
        {
          title: 'Oven',
          type: 'material',
          param: 'materials.oven',
          category: 'oven' + (largeCooktop ? '90' : '60')
        })
    }
    if (this.a.cooktopType.indexOf('electro') > -1) {
      contextMenu.controls.push(
        {
          title: 'Cooktop',
          type: 'material',
          param: 'materials.cooktop',
          category: 'cooktop' + (largeCooktop ? '90' : '60')
        })
    }
    */

    function genKitchenMenu(name, el, conflict, high, low, pos, key) {
      contextMenu.controls.splice(pos + 1, 0, {
        type: 'html',
        display: '<div>' + name + ' Position:</div>',
        style: 'margin: 5px 0; display: inline-block; width: 50%; vertical-align: top;',

      })
      elements.forEach(function(key, index) {
        var inValidPos
        if (high && low) inValidPos = false
        else if (high) inValidPos = index > cLeft - 1 && index < cRight
        else if (low) inValidPos = index <= cLeft - 1 || index >= cRight
        var conflictPos = conflict ? visible[conflict] && self.a[conflict + 'Pos'] === index + 1 : false
        var minWidth = key < (name === 'Fridge' ? 0.52 : 0.6 )
        var inValid = conflictPos || minWidth || inValidPos
        var color = self.a[el] === index + 1 ? 'background-color: #5bb3d0': inValid ? 'background-color: #ccc' : ''
        contextMenu.controls.splice(pos + 2 + index, 0, {
          type: 'button',
          display: '<div></div>',
          style: 'margin: 5px 0 0 0; display: inline-block; width: '+ (key * 30) + 'px; border: 1px solid ' + (self.a[el] === index + 1?'#489':'#ccc') + '; height: ' + (index <= cLeft - 1 || index >= cRight ? 0.9 * 30 : 0.6 * 30) + 'px; ' + color,
          onInput: function() {
            console.log(index + 1, conflictPos, inValidPos, minWidth, el)
            var change = {}
            change[el] = index + 1
            //if (!inValid) self.set(change)
            self.set(change)
          }
        })
      })
    }

    function findParam(param) {
      var pos
      contextMenu.controls.forEach(function(control, i) {
        if (control.param === param ) pos = i
      })
      return pos
    }

    return contextMenu
  },

  loadingQueuePrefix: 'interior',

  controls3d: 'twoPoints',

  meshes3d: function (a) {

    console.log('kitchen mesh', JSON.stringify(a))

    //var a = this.attributes

    // internals
    var
      fridgeHeight = 1.95,
      sinkWidth = 0.47,
      barCounter = 0.25,
      sink = a.sinkType !== 'none',
      oven = a.ovenType !== 'none',
      cooktop = a.cooktopType !== 'none',
      microwave = a.microwave,
      largeCooktop = cooktop && a.cooktopType.slice(-2) === '90',
      cabinetType = a.cabinetType

    // config
    var
      ovenDistance = 0.02,
      extractorHeight = 0.04,
      extractorPyramid = largeCooktop ? 0.18 : 0.12,
      extractorBottom = a.wallCabinetHeight + 0.1,
      extractorWidth = 0.50,
      microwaveHeight = 0.33,
      ovenHeight = largeCooktop && a.ovenPos === a.cooktopPos ? 0.48 : 0.6,
      offsetY = -0.01,
      minWallCabinet = 0.3,
      cabinetSegments = [
        [a.baseBoard, 0.7, 1.9, a.h + offsetY],                                                                 // 0 High Cabinet
        [a.baseBoard, 0.7, 1.30, 1.9, a.h + offsetY],                                                           // 1 High Cabinet Oven
        [a.baseBoard, 0.4, 0.7, a.counterHeight - a.counterThickness],                                          // 2 Base Cabinet 3 Drawers
        [a.baseBoard, 0.7, a.counterHeight - a.counterThickness],                                               // 3 Base Cabinet 2 Drawers
        [a.baseBoard, a.counterHeight - a.counterThickness - ovenHeight, a.counterHeight - a.counterThickness], // 4 Base Cabinet Oven
        [a.wallCabinetHeight, a.h + offsetY],                                                                   // 5 Wall Cabinet
        [a.wallCabinetHeight, a.wallCabinetHeight + microwaveHeight, a.h + offsetY] ,                           // 6 Wall Cabinet Microwave
        [a.baseBoard + fridgeHeight, a.h + offsetY],                                                            // 7 High Cabinet Fridge
        [a.baseBoard, 0.7, 1.9 - microwaveHeight, 1.9, a.h + offsetY],                                          // 8 High Cabinet Microwave
        [a.baseBoard, 0.7, 1.30, 1.9, 1.9 + microwaveHeight, a.h + offsetY],                                    // 9 High Cabinet Oven Microwave
      ],
      elementLength = a.elementLength,
      i,
      elementNum, elements = []

    ///////////////////
    // INPUT VALIDATION
    ///////////////////

    // prevent invalid input
    if (a.highCabinetLeft < 0) a.highCabinetLeft = 0
    if (a.highCabinetRight < 0) a.highCabinetRight = 0
    if (a.fridgePos <= 0) a.fridgePos = 1

    // validate materials
    try {
      if (this.a.ovenPos === this.a.cooktopPos && _.isString(this.a.materials.oven)) {
        if (largeCooktop && _.isString(this.a.materials.oven) && this.a.materials.oven.indexOf('_60') > -1) this.setMaterial('oven', 'oven_miele_90-48')
        if (!largeCooktop && _.isString(this.a.materials.oven) && this.a.materials.oven.indexOf('_90') > -1) this.setMaterial('oven', 'oven_miele_60-60')
      }
      if (_.isString(this.a.materials.cooktop)) {
        if (largeCooktop && this.a.materials.cooktop.indexOf('_60') > -1) this.setMaterial('cooktop', 'cooktop_westinghouse_90')
        if (!largeCooktop && this.a.materials.cooktop.indexOf('_90') > -1) this.setMaterial('cooktop', 'cooktop_westinghouse_60')
      }
    } catch(err) { /* */ }

    // prevent bar counter with high cabinets
    if ((a.highCabinetLeft || a.highCabinetRight) && a.barCounter) a.barCounter = false
    // prevent integrated extractor when there is no wall cabinet
    if (!a.wallCabinet && a.extractorType === 'integrated') a.extractorType = 'box'

    elementNum = getElCount(a).elementNum
    remainder = getElCount(a).remainder

    // check if fridge fits
    if (a.fridge && a.highCabinetLeft < a.fridgePos + 1) {
      console.log(elementNum - a.highCabinetRight - 1)
      if (a.fridgePos < elementNum - a.highCabinetRight - 1 ) a.highCabinetLeft = a.fridgePos + 1
      else a.fridgePos = a.highCabinetLeft - 1

    }

    // convert 90 cooktop to 60 if is space is too small
    if (cooktop && a.cooktopPos >= elementNum - a.highCabinetRight && a.cooktopType.slice(-2) === '90') {
      console.log('Large cooktop does not fit')
      a.cooktopType = a.cooktopType.substring(0, a.cooktopType.length - 2) + '60'
      elementNum = getElCount(a).elementNum
      remainder = getElCount(a).remainder
    }

    elements = updatePositions(a, {elementNum: elementNum, remainder: remainder})

    // validate positions
    var
      cLeft = a.highCabinetLeft,
      cRight = elementNum - a.highCabinetRight,
      baseCabinets = cRight - cLeft - (remainder > 0 ? 1 : 0),
      openPositions = []

    for (i = cLeft; i < cRight; i++) {
      if ((!cooktop || i !== a.cooktopPos - 1) && (!sink || i !== a.sinkPos - 1) && elements[i] >= elementLength) openPositions.push(i)
    }

    if (!baseCabinets) {
      a.sinkType = 'none'
      a.cooktopType = 'none'
    }

    if (a.highCabinetLeft && a.highCabinetRight + a.highCabinetLeft > elementNum) a.highCabinetLeft -= 1
    else if (a.highCabinetRight * elementLength > a.l) a.highCabinetRight -= 1

    // try to place out of scope elements
    if (openPositions.length > 0) {
      if (cooktop && a.cooktopPos <= cLeft) a.cooktopPos = openPositions[0] + 1
      if (cooktop && a.cooktopPos > cRight) a.cooktopPos = openPositions[openPositions.length - 1] + 1

      if (sink && a.sinkPos <= cLeft) a.sinkPos = openPositions[0] + 1
      if (sink && a.sinkPos > cRight) a.sinkPos = openPositions[openPositions.length - 1] + 1
    }

    if (oven && a.ovenType === 'double' && a.ovenPos > cLeft && a.ovenPos < cRight) a.ovenType = 'single'
    if (oven && sink && a.ovenPos === a.sinkPos) a.ovenPos -= 1
    if (oven && a.ovenPos <= 0) a.ovenPos = cLeft + 1
    if (oven && a.ovenPos > elementNum) a.ovenPos = cRight - 1

    // prevent placement in small cabinet
    if (cooktop && elements[a.cooktopPos - 1] < elementLength) a.cooktopPos -= 1
    if (sink && elements[a.sinkPos - 1] < elementLength) a.sinkPos -= 1
    if (sink && a.sinkType === 'double' && elements[a.sinkPos] < elementLength) a.sinkType = 'single'
    if (oven && elements[a.ovenPos - 1] < elementLength) {
      if (a.highCabinetRight > 0) a.ovenPos += 1
      else a.ovenPos -=1
    }
    if (microwave && elements[a.microwavePos - 1] < elementLength) a.microwavePos -= 1

    // prevent collision
    if (sink && a.sinkType === 'double' && cooktop && a.sinkPos + 1 === a.cooktopPos) a.sinkType = 'single'
    if (sink && cooktop && a.sinkPos === a.cooktopPos && openPositions.length > 0) {
      if (openPositions.length > 1 && openPositions[openPositions.length - 1] + 1 === a.sinkPos) a.sinkPos = openPositions[0] + 1
      else a.sinkPos = openPositions[openPositions.length - 1] + 1
    }

    // deactivate elements
    if (sink && cooktop && a.sinkPos === a.cooktopPos) a.sinkType = 'none'
    if (a.sinkPos <= cLeft || a.sinkPos > cRight) a.sinkType = 'none'
    if (a.cooktopType <= cLeft || a.cooktopType > cRight) a.cooktopType = 'none'

    elements = updatePositions(a, {elementNum: elementNum, remainder: remainder})

    // get x coordinate for element index
    function getElementPos(pos) {
      var l = 0
      for (var i = 0; i < pos - 1; i++) { l += elements[i] }
      return l
    }

    sink = a.sinkType !== 'none'
    oven = a.ovenType !== 'none'
    cooktop = a.cooktopType !== 'none'

    var
      sinkLength = a.sinkType === 'single' ? 0.54 : 1.16,
      sinkOffset = a.sinkType === 'single' ? 0.03 : 0.02,
      extractor = a.extractorType !== 'none',
      xCursor = 0, xCursorRight = 0,
      baseCabinetNum = elementNum - a.highCabinetLeft - a.highCabinetRight,

      // internals
      k = 0,
      kitchenVertices = [],
      kvPos = 0,
      counterVertices = [],
      cvPos = 0,
      extractorVertices = [],
      evPos = 0,
      ovenVertices = [],
      ovPos = 0,
      ovenUvs = [],
      ovUvPos = 0,
      cooktopVertices = [],
      cooktopUvs = [],
      mwVertices = [],
      mwUvs = [],
      aX,aY,aZ,bY,cX,eX,eY,eZ,fY,gX,iX, iY, iZ, jY, jZ, kX, mX, mY, mZ, nY, nZ, oX, qZ

    ///////////////////
    // GEOMETRY FUNCTIONS
    //////////////////

    function cabinetDoor(params) {

      ///////////////////
      // CABINET DOORS
      //////////////////

      var minCabinet = 0.1
      var minCabinetFrame = 0.15
      var isFlat = cabinetType === 'flat'

      // FRONT VIEW VERTICES
      //
      // A----------C    I----------K
      // |E\I----G\K|    | M------O |
      // | |      | |    | | Q  S | |
      // | |      | |    | | R  T | |
      // |F\J----H\L|    | N------P |
      // B----------D    J----------L
      // U----------V

      //           __
      // style 1 _|  \__
      //
      //         _   __
      // style 2  |_/

      var outerZOffset = cabinetType === 'style1' ? 0.01 : cabinetType === 'style2' ? -0.01 : a.doorWidth
      var outerOffset = cabinetType === 'style1' ? 0.04 : cabinetType === 'style2' ? 0.005 : 0
      var innerZOffset = cabinetType === 'style1' ? -0.01 : cabinetType === 'style2' ? 0.02 : 0
      var innerOffset = cabinetType === 'style1' ? 0.015 : cabinetType === 'style2' ? 0.03 : 0

      aX = params.aX
      aY = params.aY
      aZ = params.aZ
      bY = params.bY
      cX = params.cX
      eY = aY - a.doorWidth / 2
      iZ = aZ + outerZOffset
      fY = bY + a.doorWidth / 2

      // prevent messed up polygons
      if (aY <= bY || cX <= aX ) return

      mX = eX + outerOffset
      mY = eY - outerOffset
      nY = fY + outerOffset
      oX = gX - outerOffset
      var qX = mX + innerOffset
      var qY = mY - innerOffset
      qZ = iZ + innerZOffset
      var rY = nY + innerOffset
      var sX = oX - innerOffset

      // ADD BASEBOARD FOR LOWEST TILE
      if (params.i === 0) {
        //B
        kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = aX
        kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = a.baseBoard
        kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = aZ
        //U
        kitchenVertices[kvPos + 3] = aX
        kitchenVertices[kvPos + 4] = 0
        kitchenVertices[kvPos + 5] = aZ
        //V
        kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = cX
        kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = 0
        kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = aZ
        //D
        kitchenVertices[kvPos + 15] = cX
        kitchenVertices[kvPos + 16] = a.baseBoard
        kitchenVertices[kvPos + 17] = aZ

        kvPos = kvPos + 18
      }

      // if the gap is too small we'll put a simple placeholder
      if (cX - aX < minCabinet || aY - bY < minCabinet) {
        // PLACE HOLDER
        //A
        kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = aX
        kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = aY
        kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = aZ
        //B
        kitchenVertices[kvPos + 3] = aX
        kitchenVertices[kvPos + 4] = bY
        kitchenVertices[kvPos + 5] = aZ
        //D
        kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = cX
        kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = bY
        kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = aZ
        //C
        kitchenVertices[kvPos + 15] = cX
        kitchenVertices[kvPos + 16] = aY
        kitchenVertices[kvPos + 17] = aZ

        kvPos = kvPos + 18

        return
      }

      var showMicroWave = false, showOven = false
      if ( microwave && c + 1 === a.microwavePos ) {
        if (params.k === 6 && params.i === 0) showMicroWave = true
        else if (params.k === 8 && params.i === 2) showMicroWave = true
        else if (params.k === 9 && params.i === 3) showMicroWave = true
      }
      if ( oven && c + 1 === a.ovenPos ) {
        if (params.k === 1 && (params.i === 1 || (params.i === 2 && a.ovenType === 'double'))) showOven = true
        else if (params.k === 4 || params.k === 9) {
          if (params.i === 1 || (params.i === 2 && a.ovenType === 'double')) showOven = true
        }
      }
      // if (oven && c + 1 === a.ovenPos && a.ovenType === 'double') console.log('double oven', params.k, params.i, a.ovenType)
      // if (showMicroWave) console.log('showMicroWav', params.k, params.i)
      // if (showOven) console.log('showOven', params.k, params.i, a.ovenType)

      // DOOR FRAME
      //A
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = aX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = aY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = aZ
      //B
      kitchenVertices[kvPos + 3] = aX
      kitchenVertices[kvPos + 4] = bY
      kitchenVertices[kvPos + 5] = aZ
      //F
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = eX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = fY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = aZ
      //E
      kitchenVertices[kvPos + 15] = eX
      kitchenVertices[kvPos + 16] = eY
      kitchenVertices[kvPos + 17] = aZ

      kvPos = kvPos + 18

      //F
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = eX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = fY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = aZ
      //B
      kitchenVertices[kvPos + 3] = aX
      kitchenVertices[kvPos + 4] = bY
      kitchenVertices[kvPos + 5] = aZ
      //D
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = cX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = bY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = aZ
      //H
      kitchenVertices[kvPos + 15] = gX
      kitchenVertices[kvPos + 16] = fY
      kitchenVertices[kvPos + 17] = aZ

      kvPos = kvPos + 18

      //G
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = gX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = eY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = aZ
      //H
      kitchenVertices[kvPos + 3] = gX
      kitchenVertices[kvPos + 4] = fY
      kitchenVertices[kvPos + 5] = aZ
      //D
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = cX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = bY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = aZ
      //C
      kitchenVertices[kvPos + 15] = cX
      kitchenVertices[kvPos + 16] = aY
      kitchenVertices[kvPos + 17] = aZ

      kvPos = kvPos + 18

      //A
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = aX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = aY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = aZ
      //E
      kitchenVertices[kvPos + 3] = eX
      kitchenVertices[kvPos + 4] = eY
      kitchenVertices[kvPos + 5] = aZ
      //G
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = gX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = eY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = aZ
      //C
      kitchenVertices[kvPos + 15] = cX
      kitchenVertices[kvPos + 16] = aY
      kitchenVertices[kvPos + 17] = aZ

      kvPos = kvPos + 18

      // DOOR LEAF SIDES

      //E
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = eX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = eY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = aZ
      //F
      kitchenVertices[kvPos + 3] = eX
      kitchenVertices[kvPos + 4] = fY
      kitchenVertices[kvPos + 5] = aZ
      //J
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = eX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = fY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = iZ
      //I
      kitchenVertices[kvPos + 15] = eX
      kitchenVertices[kvPos + 16] = eY
      kitchenVertices[kvPos + 17] = iZ

      kvPos = kvPos + 18

      //J
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = eX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = fY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = iZ
      //F
      kitchenVertices[kvPos + 3] = eX
      kitchenVertices[kvPos + 4] = fY
      kitchenVertices[kvPos + 5] = aZ
      //H
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = gX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = fY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = aZ
      //L
      kitchenVertices[kvPos + 15] = gX
      kitchenVertices[kvPos + 16] = fY
      kitchenVertices[kvPos + 17] = iZ

      kvPos = kvPos + 18

      //K
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = gX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = eY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = iZ
      //L
      kitchenVertices[kvPos + 3] = gX
      kitchenVertices[kvPos + 4] = fY
      kitchenVertices[kvPos + 5] = iZ
      //H
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = gX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = fY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = aZ
      //G
      kitchenVertices[kvPos + 15] = gX
      kitchenVertices[kvPos + 16] = eY
      kitchenVertices[kvPos + 17] = aZ

      kvPos = kvPos + 18

      //E
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = eX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = eY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = aZ
      //I
      kitchenVertices[kvPos + 3] = eX
      kitchenVertices[kvPos + 4] = eY
      kitchenVertices[kvPos + 5] = iZ
      //K
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = gX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = eY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = iZ
      //G
      kitchenVertices[kvPos + 15] = gX
      kitchenVertices[kvPos + 16] = eY
      kitchenVertices[kvPos + 17] = aZ

      kvPos = kvPos + 18

      // DOOR LEAF FRONT
      if ( showOven ) {

        // oven front

        //I
        ovenVertices[ovPos] = ovenVertices[ovPos + 9] = eX
        ovenVertices[ovPos + 1] = ovenVertices[ovPos + 10] = eY
        ovenVertices[ovPos + 2] = ovenVertices[ovPos + 11] = iZ
        //J
        ovenVertices[ovPos + 3] = eX
        ovenVertices[ovPos + 4] = fY
        ovenVertices[ovPos + 5] = iZ
        //L
        ovenVertices[ovPos + 6] = ovenVertices[ovPos + 12] = gX
        ovenVertices[ovPos + 7] = ovenVertices[ovPos + 13] = fY
        ovenVertices[ovPos + 8] = ovenVertices[ovPos + 14] = iZ
        //K
        ovenVertices[ovPos + 15] = gX
        ovenVertices[ovPos + 16] = eY
        ovenVertices[ovPos + 17] = iZ

        ovPos = ovPos + 18

        //I
        ovenUvs [ovUvPos] = ovenUvs [ovUvPos + 6] = 0
        ovenUvs [ovUvPos + 1] = ovenUvs [ovUvPos + 7] = 1
        //J
        ovenUvs [ovUvPos + 2] = 0
        ovenUvs [ovUvPos + 3] = 0 //0.5
        //L
        ovenUvs [ovUvPos + 4] = ovenUvs [ovUvPos + 8] = 1
        ovenUvs [ovUvPos + 5] = ovenUvs [ovUvPos + 9] = 0 //0.5
        //K
        ovenUvs [ovUvPos + 10] = 1
        ovenUvs [ovUvPos + 11] = 1

        ovUvPos = ovUvPos + 12


        //kvPos = kvPos+18

      } else if ( showMicroWave ) {

        // microwave front

        //I
        mwVertices[0] = mwVertices[9] = eX
        mwVertices[1] = mwVertices[10] = eY
        mwVertices[2] = mwVertices[11] = iZ
        //J
        mwVertices[3] = eX
        mwVertices[4] = fY
        mwVertices[5] = iZ
        //L
        mwVertices[6] = mwVertices[12] = gX
        mwVertices[7] = mwVertices[13] = fY
        mwVertices[8] = mwVertices[14] = iZ
        //K
        mwVertices[15] = gX
        mwVertices[16] = eY
        mwVertices[17] = iZ

        mwUvs = [0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1]


        //kvPos = kvPos+18

      } else {

        // regular front

        if (isFlat ||  cX - aX <= minCabinetFrame || aY - bY <= minCabinetFrame ){

          //I
          kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = eX
          kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = eY
          kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = iZ
          //J
          kitchenVertices[kvPos + 3] = eX
          kitchenVertices[kvPos + 4] = fY
          kitchenVertices[kvPos + 5] = iZ
          //L
          kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = gX
          kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = fY
          kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = iZ
          //K
          kitchenVertices[kvPos + 15] = gX
          kitchenVertices[kvPos + 16] = eY
          kitchenVertices[kvPos + 17] = iZ

          kvPos = kvPos + 18

        } else {

          // front facing ring

          //I
          kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = eX
          kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = eY
          kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = iZ
          //J
          kitchenVertices[kvPos + 3] = eX
          kitchenVertices[kvPos + 4] = fY
          kitchenVertices[kvPos + 5] = iZ
          //N
          kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = mX
          kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = nY
          kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = iZ
          //M
          kitchenVertices[kvPos + 15] = mX
          kitchenVertices[kvPos + 16] = mY
          kitchenVertices[kvPos + 17] = iZ

          kvPos = kvPos + 18

          //N
          kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = mX
          kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = nY
          kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = iZ
          //J
          kitchenVertices[kvPos + 3] = eX
          kitchenVertices[kvPos + 4] = fY
          kitchenVertices[kvPos + 5] = iZ
          //L
          kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = gX
          kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = fY
          kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = iZ
          //P
          kitchenVertices[kvPos + 15] = oX
          kitchenVertices[kvPos + 16] = nY
          kitchenVertices[kvPos + 17] = iZ

          kvPos = kvPos + 18

          //O
          kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = oX
          kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = mY
          kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = iZ
          //P
          kitchenVertices[kvPos + 3] = oX
          kitchenVertices[kvPos + 4] = nY
          kitchenVertices[kvPos + 5] = iZ
          //L
          kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = gX
          kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = fY
          kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = iZ
          //K
          kitchenVertices[kvPos + 15] = gX
          kitchenVertices[kvPos + 16] = eY
          kitchenVertices[kvPos + 17] = iZ

          kvPos = kvPos + 18

          //I
          kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = eX
          kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = eY
          kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = iZ
          //M
          kitchenVertices[kvPos + 3] = mX
          kitchenVertices[kvPos + 4] = mY
          kitchenVertices[kvPos + 5] = iZ
          //O
          kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = oX
          kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = mY
          kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = iZ
          //K
          kitchenVertices[kvPos + 15] = gX
          kitchenVertices[kvPos + 16] = eY
          kitchenVertices[kvPos + 17] = iZ

          kvPos = kvPos + 18

          // inner facing ring

          //M
          kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = mX
          kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = mY
          kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = iZ
          //N
          kitchenVertices[kvPos + 3] = mX
          kitchenVertices[kvPos + 4] = nY
          kitchenVertices[kvPos + 5] = iZ
          //R
          kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = qX
          kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = rY
          kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = qZ
          //Q
          kitchenVertices[kvPos + 15] = qX
          kitchenVertices[kvPos + 16] = qY
          kitchenVertices[kvPos + 17] = qZ

          kvPos = kvPos + 18

          //R
          kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = qX
          kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = rY
          kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = qZ
          //N
          kitchenVertices[kvPos + 3] = mX
          kitchenVertices[kvPos + 4] = nY
          kitchenVertices[kvPos + 5] = iZ
          //P
          kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = oX
          kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = nY
          kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = iZ
          //T
          kitchenVertices[kvPos + 15] = sX
          kitchenVertices[kvPos + 16] = rY
          kitchenVertices[kvPos + 17] = qZ

          kvPos = kvPos + 18

          //S
          kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = sX
          kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = qY
          kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = qZ
          //T
          kitchenVertices[kvPos + 3] = sX
          kitchenVertices[kvPos + 4] = rY
          kitchenVertices[kvPos + 5] = qZ
          //P
          kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = oX
          kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = nY
          kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = iZ
          //O
          kitchenVertices[kvPos + 15] = oX
          kitchenVertices[kvPos + 16] = mY
          kitchenVertices[kvPos + 17] = iZ

          kvPos = kvPos + 18

          //M
          kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = mX
          kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = mY
          kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = iZ
          //Q
          kitchenVertices[kvPos + 3] = qX
          kitchenVertices[kvPos + 4] = qY
          kitchenVertices[kvPos + 5] = qZ
          //S
          kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = sX
          kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = qY
          kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = qZ
          //O
          kitchenVertices[kvPos + 15] = oX
          kitchenVertices[kvPos + 16] = mY
          kitchenVertices[kvPos + 17] = iZ

          kvPos = kvPos + 18

          // inner face

          //Q
          kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = qX
          kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = qY
          kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = qZ
          //R
          kitchenVertices[kvPos + 3] = qX
          kitchenVertices[kvPos + 4] = rY
          kitchenVertices[kvPos + 5] = qZ
          //T
          kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = sX
          kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = rY
          kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = qZ
          //S
          kitchenVertices[kvPos + 15] = sX
          kitchenVertices[kvPos + 16] = qY
          kitchenVertices[kvPos + 17] = qZ

          kvPos = kvPos + 18
        }
      }
    }

    function genExtractor () {
      // EXTRACTOR
      //   E------G
      //  /|     /|
      // A------C |
      // | F----|-H
      // |/     |/
      // B------D

      var
        isIntegrated = a.extractorType === 'integrated',
        aX = getElementPos(a.cooktopPos) + (a.wallCabinet && !isIntegrated ? 0.05 : 0 ),
        aY = extractorBottom + extractorHeight,
        aZ = a.wallCabinet && isIntegrated ? extractorWidth : a.w - 0.6 + extractorWidth,
        cX = getElementPos(a.cooktopPos + 1) - (a.wallCabinet && !isIntegrated ? 0.05 : 0 ),
        eZ = a.wallCabinet && isIntegrated ? a.wallCabinetWidth : a.w - 0.6,
        bY = extractorBottom // a.wallCabinetHeight

      // front
      // A
      extractorVertices[evPos] = extractorVertices[evPos + 9] = aX
      extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = aY
      extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = aZ
      //B
      extractorVertices[evPos + 3] = aX
      extractorVertices[evPos + 4] = bY
      extractorVertices[evPos + 5] = aZ
      //D
      extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = cX
      extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = bY
      extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = aZ
      //C
      extractorVertices[evPos + 15] = cX
      extractorVertices[evPos + 16] = aY
      extractorVertices[evPos + 17] = aZ

      evPos = evPos + 18

      if (a.wallCabinet && isIntegrated) {
        // top
        // E
        extractorVertices[evPos] = extractorVertices[evPos + 9] = aX
        extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = aY
        extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = eZ
        //A
        extractorVertices[evPos + 3] = aX
        extractorVertices[evPos + 4] = aY
        extractorVertices[evPos + 5] = aZ
        //C
        extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = cX
        extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = aY
        extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = aZ
        //G
        extractorVertices[evPos + 15] = cX
        extractorVertices[evPos + 16] = aY
        extractorVertices[evPos + 17] = eZ

        evPos = evPos + 18
      }

      // left
      // E
      extractorVertices[evPos] = extractorVertices[evPos + 9] = aX
      extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = aY
      extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = eZ
      //F
      extractorVertices[evPos + 3] = aX
      extractorVertices[evPos + 4] = bY
      extractorVertices[evPos + 5] = eZ
      //B
      extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = aX
      extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = bY
      extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = aZ
      //A
      extractorVertices[evPos + 15] = aX
      extractorVertices[evPos + 16] = aY
      extractorVertices[evPos + 17] = aZ

      evPos = evPos + 18

      // right
      //C
      extractorVertices[evPos] = extractorVertices[evPos + 9] = cX
      extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = aY
      extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = aZ
      //D
      extractorVertices[evPos + 3] = cX
      extractorVertices[evPos + 4] = bY
      extractorVertices[evPos + 5] = aZ
      //H
      extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = cX
      extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = bY
      extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = eZ
      //G
      extractorVertices[evPos + 15] = cX
      extractorVertices[evPos + 16] = aY
      extractorVertices[evPos + 17] = eZ

      evPos = evPos + 18


      // bottom
      //B
      extractorVertices[evPos] = extractorVertices[evPos + 9] = aX
      extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = bY
      extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = aZ
      //F
      extractorVertices[evPos + 3] = aX
      extractorVertices[evPos + 4] = bY
      extractorVertices[evPos + 5] = eZ
      //H
      extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = cX
      extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = bY
      extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = eZ
      //D
      extractorVertices[evPos + 15] = cX
      extractorVertices[evPos + 16] = bY
      extractorVertices[evPos + 17] = aZ

      evPos = evPos + 18

      // back
      //G
      extractorVertices[evPos] = extractorVertices[evPos + 9] = cX
      extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = aY
      extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = eZ
      //H
      extractorVertices[evPos + 3] = cX
      extractorVertices[evPos + 4] = bY
      extractorVertices[evPos + 5] = eZ
      //F
      extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = aX
      extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = bY
      extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = eZ
      //E
      extractorVertices[evPos + 15] = aX
      extractorVertices[evPos + 16] = aY
      extractorVertices[evPos + 17] = eZ

      evPos = evPos + 18

      if (!a.wallCabinet || a.extractorType !== 'integrated') {

        var centerVent = (a.w >= 0.7 && !a.wallCabinet) || a.barCounter

        iX = aX + (cX - aX) / 2 - 0.12
        iY = a.h + offsetY
        iZ = centerVent ? a.w - 0.25 : a.w - 0.4
        jY = aY + (a.extractorType === 'pyramid' ? extractorPyramid : 0)
        kX = iX + 0.24
        mZ = centerVent ? a.w - 0.45 : a.w - 0.6

        // EXTRACTOR ROOF TOP
        // E-N--P--G
        // | J--L  |
        // |       |
        // A-------C


        // LEFT
        // E
        extractorVertices[evPos] = extractorVertices[evPos + 9] = aX
        extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = aY
        extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = eZ
        // A
        extractorVertices[evPos + 3] = aX
        extractorVertices[evPos + 4] = aY
        extractorVertices[evPos + 5] = aZ
        //J
        extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = iX
        extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = jY
        extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = iZ
        //N
        extractorVertices[evPos + 15] = iX
        extractorVertices[evPos + 16] = jY
        extractorVertices[evPos + 17] = mZ

        evPos = evPos + 18

        // FRONT
        // J
        extractorVertices[evPos] = extractorVertices[evPos + 9] = iX
        extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = jY
        extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = iZ
        // A
        extractorVertices[evPos + 3] = aX
        extractorVertices[evPos + 4] = aY
        extractorVertices[evPos + 5] = aZ
        // C
        extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = cX
        extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = aY
        extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = aZ
        // L
        extractorVertices[evPos + 15] = kX
        extractorVertices[evPos + 16] = jY
        extractorVertices[evPos + 17] = iZ

        evPos = evPos + 18

        // RIGHT
        // P
        extractorVertices[evPos] = extractorVertices[evPos + 9] = kX
        extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = jY
        extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = mZ
        // L
        extractorVertices[evPos + 3] = kX
        extractorVertices[evPos + 4] = jY
        extractorVertices[evPos + 5] = iZ
        // C
        extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = cX
        extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = aY
        extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = aZ
        // G
        extractorVertices[evPos + 15] = cX
        extractorVertices[evPos + 16] = aY
        extractorVertices[evPos + 17] = eZ

        evPos = evPos + 18

        if (a.extractorType === 'pyramid' || a.w > 0.6 || a.barCounter ) {
          // BACK
          // E
          extractorVertices[evPos] = extractorVertices[evPos + 9] = aX
          extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = aY
          extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = eZ
          // N
          extractorVertices[evPos + 3] = iX
          extractorVertices[evPos + 4] = jY
          extractorVertices[evPos + 5] = mZ
          // P
          extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = kX
          extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = jY
          extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = mZ
          // G
          extractorVertices[evPos + 15] = cX
          extractorVertices[evPos + 16] = aY
          extractorVertices[evPos + 17] = eZ

          evPos = evPos + 18
        }


        // ventilation
        //   M------O
        //  /|     /|
        // I------K |
        // | N----|-P
        // |/     |/
        // J------L

        // front
        // A
        extractorVertices[evPos] = extractorVertices[evPos + 9] = iX
        extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = iY
        extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = iZ
        //B
        extractorVertices[evPos + 3] = iX
        extractorVertices[evPos + 4] = jY
        extractorVertices[evPos + 5] = iZ
        //D
        extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = kX
        extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = jY
        extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = iZ
        //C
        extractorVertices[evPos + 15] = kX
        extractorVertices[evPos + 16] = iY
        extractorVertices[evPos + 17] = iZ

        evPos = evPos + 18

        // top
        // E
        extractorVertices[evPos] = extractorVertices[evPos + 9] = iX
        extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = iY
        extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = mZ
        //A
        extractorVertices[evPos + 3] = iX
        extractorVertices[evPos + 4] = iY
        extractorVertices[evPos + 5] = iZ
        //C
        extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = kX
        extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = iY
        extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = iZ
        //G
        extractorVertices[evPos + 15] = kX
        extractorVertices[evPos + 16] = iY
        extractorVertices[evPos + 17] = mZ

        evPos = evPos + 18

        // left
        // E
        extractorVertices[evPos] = extractorVertices[evPos + 9] = iX
        extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = iY
        extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = mZ
        //F
        extractorVertices[evPos + 3] = iX
        extractorVertices[evPos + 4] = jY
        extractorVertices[evPos + 5] = mZ
        //B
        extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = iX
        extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = jY
        extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = iZ
        //A
        extractorVertices[evPos + 15] = iX
        extractorVertices[evPos + 16] = iY
        extractorVertices[evPos + 17] = iZ

        evPos = evPos + 18

        // right
        //C
        extractorVertices[evPos] = extractorVertices[evPos + 9] = kX
        extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = iY
        extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = iZ
        //D
        extractorVertices[evPos + 3] = kX
        extractorVertices[evPos + 4] = jY
        extractorVertices[evPos + 5] = iZ
        //H
        extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = kX
        extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = jY
        extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = mZ
        //G
        extractorVertices[evPos + 15] = kX
        extractorVertices[evPos + 16] = iY
        extractorVertices[evPos + 17] = mZ

        evPos = evPos + 18

        // back
        //O
        extractorVertices[evPos] = extractorVertices[evPos + 9] = kX
        extractorVertices[evPos + 1] = extractorVertices[evPos + 10] = iY
        extractorVertices[evPos + 2] = extractorVertices[evPos + 11] = mZ
        //P
        extractorVertices[evPos + 3] = kX
        extractorVertices[evPos + 4] = jY
        extractorVertices[evPos + 5] = mZ
        //N
        extractorVertices[evPos + 6] = extractorVertices[evPos + 12] = iX
        extractorVertices[evPos + 7] = extractorVertices[evPos + 13] = jY
        extractorVertices[evPos + 8] = extractorVertices[evPos + 14] = mZ
        //M
        extractorVertices[evPos + 15] = iX
        extractorVertices[evPos + 16] = iY
        extractorVertices[evPos + 17] = mZ

        evPos = evPos + 18
      }

      // reset variables
      aZ = a.w
      eZ = aZ
      iZ = a.w + a.doorWidth
    }

    function genCabinetBox(aX, aY, aZ, bY, cX, eZ, id) {

      ///////////////////
      // CABINET BOXES
      //////////////////

      // FRONT VIEW VERTICES
      //
      //   E------G
      //  /|     /|
      // A------C |
      // | F----|-H
      // |/     |/
      // B------D

      if (id !== 1){
        // TOP
        //E
        kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = aX
        kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = aY
        kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = eZ
        //A
        kitchenVertices[kvPos + 3] = aX
        kitchenVertices[kvPos + 4] = aY
        kitchenVertices[kvPos + 5] = aZ
        //C
        kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = cX
        kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = aY
        kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = aZ
        //G
        kitchenVertices[kvPos + 15] = cX
        kitchenVertices[kvPos + 16] = aY
        kitchenVertices[kvPos + 17] = eZ

        kvPos = kvPos + 18
      }

      // SIDES
      //E
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = aX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = aY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = eZ
      //F
      kitchenVertices[kvPos + 3] = aX
      kitchenVertices[kvPos + 4] = bY
      kitchenVertices[kvPos + 5] = eZ
      //B
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = aX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = bY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = aZ
      //A
      kitchenVertices[kvPos + 15] = aX
      kitchenVertices[kvPos + 16] = aY
      kitchenVertices[kvPos + 17] = aZ

      kvPos = kvPos + 18

      // LEFT
      //E
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = aX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = aY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = eZ
      //F
      kitchenVertices[kvPos + 3] = aX
      kitchenVertices[kvPos + 4] = bY
      kitchenVertices[kvPos + 5] = eZ
      //B
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = aX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = bY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = aZ
      //A
      kitchenVertices[kvPos + 15] = aX
      kitchenVertices[kvPos + 16] = aY
      kitchenVertices[kvPos + 17] = aZ

      kvPos = kvPos + 18

      // RIGHT
      //C
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = cX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = aY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = aZ
      //D
      kitchenVertices[kvPos + 3] = cX
      kitchenVertices[kvPos + 4] = bY
      kitchenVertices[kvPos + 5] = aZ
      //H
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = cX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = bY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = eZ
      //G
      kitchenVertices[kvPos + 15] = cX
      kitchenVertices[kvPos + 16] = aY
      kitchenVertices[kvPos + 17] = eZ

      kvPos = kvPos + 18

      // BACK
      //G
      kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = cX
      kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = aY
      kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = eZ
      //H
      kitchenVertices[kvPos + 3] = cX
      kitchenVertices[kvPos + 4] = bY
      kitchenVertices[kvPos + 5] = eZ
      //F
      kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = aX
      kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = bY
      kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = eZ
      //E
      kitchenVertices[kvPos + 15] = aX
      kitchenVertices[kvPos + 16] = aY
      kitchenVertices[kvPos + 17] = eZ

      kvPos = kvPos + 18
      if (id === 2){
        // BOTTOM
        //B
        kitchenVertices[kvPos] = kitchenVertices[kvPos + 9] = aX
        kitchenVertices[kvPos + 1] = kitchenVertices[kvPos + 10] = bY
        kitchenVertices[kvPos + 2] = kitchenVertices[kvPos + 11] = aZ
        //F
        kitchenVertices[kvPos + 3] = aX
        kitchenVertices[kvPos + 4] = bY
        kitchenVertices[kvPos + 5] = eZ
        //H
        kitchenVertices[kvPos + 6] = kitchenVertices[kvPos + 12] = cX
        kitchenVertices[kvPos + 7] = kitchenVertices[kvPos + 13] = bY
        kitchenVertices[kvPos + 8] = kitchenVertices[kvPos + 14] = eZ
        //D
        kitchenVertices[kvPos + 15] = cX
        kitchenVertices[kvPos + 16] = bY
        kitchenVertices[kvPos + 17] = aZ

        kvPos = kvPos + 18
      }
    }

    var baseCabinetCursor = getElementPos(a.highCabinetLeft + 1)

    aX = xCursor
    aY = a.counterHeight - a.counterThickness
    aZ = a.w
    bY = 0
    cX = xCursor + elements[0]
    eX = xCursor + a.doorWidth / 2
    eY = aY - a.doorWidth
    eZ = aZ
    fY = a.baseBoard
    gX = cX - a.doorWidth / 2
    iZ = a.w + a.doorWidth

    ///////////////////
    // CABINET DOORS
    //////////////////

    for (var c = 0; c < elementNum; c++) {
      aX = xCursor
      cX = xCursor + elements[c]
      eX = xCursor + a.doorWidth / 2
      gX = xCursor + elements[c] - a.doorWidth / 2

      var isSink = (c === a.sinkPos - 1 || (c === a.sinkPos && a.sinkType === 'double')) && sink

      // Get CabinetSegments depending on configuration
      if (c < a.highCabinetLeft) {
        if (a.fridge && (a.fridgePos - 1 === c || a.fridgePos === c)) k = 7
        else if (c + 1 === a.ovenPos && oven && c + 1 === a.microwavePos && microwave) k = 9
        else if (c + 1 === a.ovenPos && oven) k = 1
        else if (c + 1 === a.microwavePos && microwave) k = 8
        else k = 0
      }
      else if (c < a.highCabinetLeft + baseCabinetNum && c+1 === a.ovenPos && oven) k = 4
      //else if (c === elementNum - a.highCabinetRight - 1) k = 3
      else if (c > a.highCabinetLeft + baseCabinetNum -1 ) {
        if (c + 1 === a.ovenPos && oven && c + 1 === a.microwavePos && microwave) k = 9
        else if (c + 1 === a.ovenPos) k = 1
        else if (c + 1 === a.microwavePos && microwave) k = 8
        else k = 0
        aX = a.l - a.highCabinetRight * elementLength + xCursorRight
        eX = a.l - a.highCabinetRight * elementLength + a.doorWidth / 2 + xCursorRight
        cX = a.l - (a.highCabinetRight-1) * elementLength + xCursorRight
        gX = a.l - (a.highCabinetRight-1) * elementLength + xCursorRight - a.doorWidth / 2
        xCursorRight += elements[c];
      }
      else if ( isSink || c === a.highCabinetLeft || c === a.highCabinetLeft + baseCabinetNum - 1 ) k = 3
      else k = 2

      if (c === elementNum - a.highCabinetRight - 1) {
        cX = a.l - a.highCabinetRight * elementLength
        gX = a.l - a.highCabinetRight * elementLength - a.doorWidth / 2
      }

      if (c === a.cooktopPos-1 && cooktop && extractor) genExtractor()

      // HIGH & BASE CABINET DOORS
      for (var i = 0; i < cabinetSegments[k].length - 1; i++) {
        cabinetDoor({
          i: i,
          aX: aX,
          aY: cabinetSegments[k][i + 1],
          aZ: a.w,
          bY: cabinetSegments[k][i],
          cX: cX,
          k: k
        })

      }

      // WALL CABINET DOORS
      if (a.wallCabinet && c >= a.highCabinetLeft && c < a.highCabinetLeft + baseCabinetNum) {
        k = 5
        if (microwave && c === a.microwavePos - 1 ) k = 6
        var extractorOffset

        for (var j = 0; j < cabinetSegments[k].length - 1; j++) {
          // skip cabinet door for extractors
          if (extractor && cooktop && a.extractorType !== 'integrated') {
            if (c === a.cooktopPos - 1) continue
            if (elements[c] < minWallCabinet && c === a.cooktopPos) continue
          }
          // toggle door height for extractor
          extractorOffset = c === a.cooktopPos - 1 && cooktop && extractor ? extractorHeight + extractorBottom - a.wallCabinetHeight : 0
          cabinetDoor({
            i: j,
            aX: aX,
            aY: round(cabinetSegments[k][j + 1] + (cabinetSegments[k].length > 2 && j === 0 ? extractorOffset : 0), 100),
            aZ: a.wallCabinetWidth,
            bY: round(cabinetSegments[k][j] + extractorOffset, 100),
            cX: cX,
            k: k
          })
        }
      }
      aZ = a.w
      iZ = aZ + a.doorWidth
      xCursor += elements[c];
    }

    ///////////////////
    // CABINET BOXES
    //////////////////

    // define aX, aY, aZ, bY, cX, eZ, id for each Box Type
    // BASE CABINET BOX
    if (baseCabinetNum>0) genCabinetBox(baseCabinetCursor, a.counterHeight - a.counterThickness, a.w, 0, a.l - a.highCabinetRight * elementLength, 0,1)
    // WALL CABINET BOX
    if (a.wallCabinet && baseCabinetNum > 0) {
      var leftWallCabinet = a.cooktopPos > a.highCabinetLeft + 1
      var rightWallCabinet = elements[a.cooktopPos] >= minWallCabinet || this.a.extractorType === 'integrated'
      //console.log(elements.length, a.cooktopPos, elements[a.cooktopPos])
      if (!extractor || a.cooktopType === 'none') {
        // one single wall cabinet
        genCabinetBox(baseCabinetCursor, a.h + offsetY, a.wallCabinetWidth, a.wallCabinetHeight, a.l - a.highCabinetRight * elementLength, 0,2)
      } else if (extractor && a.extractorType !== 'integrated') {
        // two wall cabinets around the extractor
        if (leftWallCabinet) genCabinetBox(baseCabinetCursor, a.h + offsetY, a.wallCabinetWidth, a.wallCabinetHeight, getElementPos(a.cooktopPos), 0,2)
        if (rightWallCabinet) genCabinetBox(getElementPos(a.cooktopPos + 1), a.h + offsetY, a.wallCabinetWidth, a.wallCabinetHeight, a.l - a.highCabinetRight * elementLength, 0,2)
      } else {
        // two wall cabinets + the extractor integrated
        if (leftWallCabinet) genCabinetBox(baseCabinetCursor, a.h + offsetY, a.wallCabinetWidth, a.wallCabinetHeight, getElementPos(a.cooktopPos), 0,2)
        genCabinetBox(getElementPos(a.cooktopPos), a.h + offsetY, a.wallCabinetWidth, extractorBottom, getElementPos(a.cooktopPos + 1), 0,2)
        if (rightWallCabinet) genCabinetBox(getElementPos(a.cooktopPos + 1), a.h + offsetY, a.wallCabinetWidth, a.wallCabinetHeight, a.l - a.highCabinetRight * elementLength, 0, 2)
      }
    }
    // HIGH CABINET BOX LEFT
    if (a.highCabinetLeft!==0 && baseCabinetNum > 0) genCabinetBox(0, a.h + offsetY, a.w, 0, baseCabinetCursor, 0,3)
    if (a.highCabinetLeft!==0 && baseCabinetNum < 1) genCabinetBox(0, a.h + offsetY, a.w, 0, a.l, 0,3)
    // HIGH CABINET BOX RIGHT
    if (a.highCabinetRight!==0 && elementNum-a.highCabinetLeft>0) genCabinetBox(a.l - a.highCabinetRight * elementLength, a.h + offsetY, a.w, 0, a.l, 0,4)

    ///////////////////
    // COUNTER TOP
    //////////////////
    if (baseCabinetNum > 0) {
      //   E------G
      //  /|     /|
      // A------C |
      // | F----|-H
      // |/     |/
      // B------D

      aX = getElementPos(a.highCabinetLeft + 1)//baseCabinetCursor
      aY = a.counterHeight
      aZ = a.w + a.doorWidth
      bY = a.counterHeight - a.counterThickness
      cX = a.l - a.highCabinetRight * elementLength
      eZ = a.barCounter ? - barCounter : 0

      var counterElements = [
        [ // cooktop
          getElementPos(a.cooktopPos) + ovenDistance,
          a.w + a.doorWidth - 0.55,
          a.w + a.doorWidth - ovenDistance,
          getElementPos(a.cooktopPos + 1) - ovenDistance
        ],
        [ // sink
          getElementPos(a.sinkPos) + sinkOffset,
          a.w + a.doorWidth - ovenDistance - sinkWidth,
          a.w + a.doorWidth - ovenDistance,
          getElementPos(a.sinkPos) + sinkOffset + sinkLength,
        ]
      ]

      if (cooktop && sink) {
        //    E--------Q----G
        //   / I---K  M--O /
        //  / J---L  N--P /
        // A--------R----C
        if (a.cooktopPos < a.sinkPos) {
          // cooktop
          iX = counterElements [0][0]
          iZ = counterElements [0][1]
          jZ = counterElements [0][2]
          kX = counterElements [0][3]
          // sink
          mX = counterElements [1][0]
          mZ = counterElements [1][1]
          nZ = counterElements [1][2]
          oX = counterElements [1][3]
        }
        else {
          // sink
          iX = counterElements [1][0]
          iZ = counterElements [1][1]
          jZ = counterElements [1][2]
          kX = counterElements [1][3]
          // cooktop
          mX = counterElements [0][0]
          mZ = counterElements [0][1]
          nZ = counterElements [0][2]
          oX = counterElements [0][3]
        }
        // TOP
        //E
        counterVertices[cvPos] = counterVertices[cvPos + 9] = aX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = eZ
        //A
        counterVertices[cvPos + 3] = aX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = aZ
        //J
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = iX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = jZ
        //I
        counterVertices[cvPos + 15] = iX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = iZ

        cvPos = cvPos + 18

        //J
        counterVertices[cvPos] = counterVertices[cvPos + 9] = iX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = jZ
        //A
        counterVertices[cvPos + 3] = aX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = aZ
        //R
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = mX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = aZ
        //L
        counterVertices[cvPos + 15] = kX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = jZ

        cvPos = cvPos + 18

        //K
        counterVertices[cvPos] = counterVertices[cvPos + 9] = kX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = iZ
        //L
        counterVertices[cvPos + 3] = kX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = jZ
        //R
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = mX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = aZ
        //Q
        counterVertices[cvPos + 15] = mX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = eZ

        cvPos = cvPos + 18

        //E
        counterVertices[cvPos] = counterVertices[cvPos + 9] = aX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = eZ
        //I
        counterVertices[cvPos + 3] = iX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = iZ
        //K
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = kX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = iZ
        //Q
        counterVertices[cvPos + 15] = mX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = eZ

        cvPos = cvPos + 18

        //N
        counterVertices[cvPos] = counterVertices[cvPos + 9] = mX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = nZ
        //R
        counterVertices[cvPos + 3] = mX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = aZ
        //C
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = cX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = aZ
        //P
        counterVertices[cvPos + 15] = oX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = nZ

        cvPos = cvPos + 18

        //O
        counterVertices[cvPos] = counterVertices[cvPos + 9] = oX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = mZ
        //P
        counterVertices[cvPos + 3] = oX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = nZ
        //C
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = cX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = aZ
        //G
        counterVertices[cvPos + 15] = cX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = eZ

        cvPos = cvPos + 18

        //Q
        counterVertices[cvPos] = counterVertices[cvPos + 9] = mX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = eZ
        //M
        counterVertices[cvPos + 3] = mX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = mZ
        //O
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = oX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = mZ
        //G
        counterVertices[cvPos + 15] = cX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = eZ

        cvPos = cvPos + 18

        // cooktop

        iX = counterElements [0][0]
        iZ = counterElements [0][1]
        jZ = counterElements [0][2]
        kX = counterElements [0][3]

        //I
        cooktopVertices[0] = cooktopVertices[9] = iX
        cooktopVertices[1] = cooktopVertices[10] = aY
        cooktopVertices[2] = cooktopVertices[11] = iZ
        //J
        cooktopVertices[3] = iX
        cooktopVertices[4] = aY
        cooktopVertices[5] = jZ
        //L
        cooktopVertices[6] = cooktopVertices[12] = kX
        cooktopVertices[7] = cooktopVertices[13] = aY
        cooktopVertices[8] = cooktopVertices[14] = jZ
        //K
        cooktopVertices[15] = kX
        cooktopVertices[16] = aY
        cooktopVertices[17] = iZ

        //I
        cooktopUvs = [0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1]
      }
      else if (cooktop || sink) {
        //    E-------G
        //   / I---K /
        //  / J---L /
        // A-------C
        if (sink === false) {
          // cooktop
          iX = counterElements [0][0]
          iZ = counterElements [0][1]
          jZ = counterElements [0][2]
          kX = counterElements [0][3]
        }
        else {
          // sink
          iX = counterElements [1][0]
          iZ = counterElements [1][1]
          jZ = counterElements [1][2]
          kX = counterElements [1][3]
        }
        // TOP
        //E
        counterVertices[cvPos] = counterVertices[cvPos + 9] = aX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = eZ
        //A
        counterVertices[cvPos + 3] = aX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = aZ
        //J
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = iX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = jZ
        //I
        counterVertices[cvPos + 15] = iX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = iZ

        cvPos = cvPos + 18

        //J
        counterVertices[cvPos] = counterVertices[cvPos + 9] = iX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = jZ
        //A
        counterVertices[cvPos + 3] = aX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = aZ
        //C
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = cX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = aZ
        //L
        counterVertices[cvPos + 15] = kX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = jZ

        cvPos = cvPos + 18

        //K
        counterVertices[cvPos] = counterVertices[cvPos + 9] = kX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = iZ
        //L
        counterVertices[cvPos + 3] = kX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = jZ
        //C
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = cX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = aZ
        //G
        counterVertices[cvPos + 15] = cX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = eZ

        cvPos = cvPos + 18

        //E
        counterVertices[cvPos] = counterVertices[cvPos + 9] = aX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = eZ
        //I
        counterVertices[cvPos + 3] = iX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = iZ
        //K
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = kX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = iZ
        //G
        counterVertices[cvPos + 15] = cX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = eZ

        cvPos = cvPos + 18
        if (cooktop) {

          //I
          cooktopVertices[0] = cooktopVertices[9] = iX
          cooktopVertices[1] = cooktopVertices[10] = aY
          cooktopVertices[2] = cooktopVertices[11] = iZ
          //J
          cooktopVertices[3] = iX
          cooktopVertices[4] = aY
          cooktopVertices[5] = jZ
          //L
          cooktopVertices[6] = cooktopVertices[12] = kX
          cooktopVertices[7] = cooktopVertices[13] = aY
          cooktopVertices[8] = cooktopVertices[14] = jZ
          //K
          cooktopVertices[15] = kX
          cooktopVertices[16] = aY
          cooktopVertices[17] = iZ

          //I
          cooktopUvs = [0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1]
        }

      }
      else {
        // TOP
        //E
        counterVertices[cvPos] = counterVertices[cvPos + 9] = aX
        counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
        counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = eZ
        //A
        counterVertices[cvPos + 3] = aX
        counterVertices[cvPos + 4] = aY
        counterVertices[cvPos + 5] = aZ
        //C
        counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = cX
        counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = aY
        counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = aZ
        //G
        counterVertices[cvPos + 15] = cX
        counterVertices[cvPos + 16] = aY
        counterVertices[cvPos + 17] = eZ

        cvPos = cvPos + 18
      }

      // FRONT
      //A
      counterVertices[cvPos] = counterVertices[cvPos + 9] = aX
      counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
      counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = aZ
      //B
      counterVertices[cvPos + 3] = aX
      counterVertices[cvPos + 4] = bY
      counterVertices[cvPos + 5] = aZ
      //D
      counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = cX
      counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = bY
      counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = aZ
      //C
      counterVertices[cvPos + 15] = cX
      counterVertices[cvPos + 16] = aY
      counterVertices[cvPos + 17] = aZ

      cvPos = cvPos + 18

      // SIDES
      //E
      counterVertices[cvPos] = counterVertices[cvPos + 9] = aX
      counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
      counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = eZ
      //F
      counterVertices[cvPos + 3] = aX
      counterVertices[cvPos + 4] = bY
      counterVertices[cvPos + 5] = eZ
      //B
      counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = aX
      counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = bY
      counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = aZ
      //A
      counterVertices[cvPos + 15] = aX
      counterVertices[cvPos + 16] = aY
      counterVertices[cvPos + 17] = aZ

      cvPos = cvPos + 18

      //C
      counterVertices[cvPos] = counterVertices[cvPos + 9] = cX
      counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
      counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = aZ
      //D
      counterVertices[cvPos + 3] = cX
      counterVertices[cvPos + 4] = bY
      counterVertices[cvPos + 5] = aZ
      //H
      counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = cX
      counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = bY
      counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = eZ
      //G
      counterVertices[cvPos + 15] = cX
      counterVertices[cvPos + 16] = aY
      counterVertices[cvPos + 17] = eZ

      cvPos = cvPos + 18

      //G
      counterVertices[cvPos] = counterVertices[cvPos + 9] = cX
      counterVertices[cvPos + 1] = counterVertices[cvPos + 10] = aY
      counterVertices[cvPos + 2] = counterVertices[cvPos + 11] = eZ
      //H
      counterVertices[cvPos + 3] = cX
      counterVertices[cvPos + 4] = bY
      counterVertices[cvPos + 5] = eZ
      //F
      counterVertices[cvPos + 6] = counterVertices[cvPos + 12] = aX
      counterVertices[cvPos + 7] = counterVertices[cvPos + 13] = bY
      counterVertices[cvPos + 8] = counterVertices[cvPos + 14] = eZ
      //E
      counterVertices[cvPos + 15] = aX
      counterVertices[cvPos + 16] = aY
      counterVertices[cvPos + 17] = eZ

    }

    // collect meshes that need to be loaded
    var meshesToGet = {}
    if (a.sinkType !== 'none') meshesToGet.sink = a.sinkType === 'single' ? meshes.singleSink : meshes.doubleSink
    if (a.fridge) meshesToGet.fridge = meshes.fridge
    if (a.cooktopType === 'gas60' || a.cooktopType === 'gas90') meshesToGet.cooktop = meshes[a.cooktopType]

    // get external meshes
    /*
    TODO: get external mesh loading to work
    return loadData3d(meshesToGet)
      .then(function(result) {
        console.log(result)
        var dataKeys = Object.keys(result)
        var children = []
        // change mesh group positions
        var sinkX = getElementPos(a.sinkPos) + sinkOffset
        var cooktopX = getElementPos(a.cooktopPos) + elements[a.cooktopPos - 1] / 2
        dataKeys.forEach(function (dKey) {
          var data3d = result[dKey]
          // position attribute is ignored when added to the mesh directly hence we need to add it to the parent node
          // doing resolve + flatten afterwards transforms this hierarchy into flat meshes3d
          if (dKey === 'sink') data3d.position = [sinkX, a.counterHeight, a.w + a.doorWidth - ovenDistance]
          else if (dKey === 'cooktop') data3d.position = [cooktopX, a.counterHeight, a.w + a.doorWidth - ovenDistance]
          else if (dKey === 'fridge') data3d.position = [getElementPos(a.fridgePos), a.baseBoard, a.w + a.doorWidth - ovenDistance]
          children.push(data3d)
        })
        // return proper data3d
        return resolve({children: children})
      })
      .then(function(data3d) {
        // apply mesh group positions to meshes
        return flatten(data3d)
      })
      .then(function(data3d) {
        // remove duplicate materials
        data3d.meshKeys.forEach(function(key) {
          var mat = data3d.meshes[key].material
          if (mat.slice(-2) === '_1') data3d.meshes[key].material = mat.substring(0, mat.length - 2)
        })
        */
        var meshes3d = {} //data3d.meshes
        // add internal meshes
        meshes3d.kitchen = {
          positions: new Float32Array(kitchenVertices),
          normals: generateNormals.flat(kitchenVertices),
          uvs: generateUvs.architectural(kitchenVertices),
          material: 'kitchen'
        }
        meshes3d.counter = {
          positions: new Float32Array(counterVertices),
          normals: generateNormals.flat(counterVertices),
          uvs: generateUvs.architectural(counterVertices),
          material: 'counter'
        }
        meshes3d.oven = {
          positions: new Float32Array(ovenVertices),
          normals: generateNormals.flat(ovenVertices),
          uvs: new Float32Array(ovenUvs),
          material: 'oven'
        }
        meshes3d.cooktop = {
          positions: new Float32Array(cooktopVertices),
          normals: generateNormals.flat(cooktopVertices),
          uvs: new Float32Array(cooktopUvs),
          material: 'cooktop'
        }
        meshes3d.extractor = {
          positions: new Float32Array(extractorVertices),
          normals: generateNormals.flat(extractorVertices),
          material: 'tab'
        }
        meshes3d.microwave = {
          positions: new Float32Array(mwVertices),
          normals: generateNormals.flat(mwVertices),
          uvs: new Float32Array(mwUvs),
          material: 'microwave'
        }

        return meshes3d
      //})

  },

  materials3d: function generateMaterials3d(a) {
    var materials = a.materials
    materials.chrome = 'chrome'
    materials['black_metal']= {
      "specularCoef": 24,
      "colorDiffuse": [0.02, 0.02, 0.02],
      "colorSpecular": [0.7, 0.7, 0.7]
    }
    return materials
  }

}

// helper

function getElCount(a) {
  var
    cooktop = a.cooktopType !== 'none',
    largeCooktop = cooktop && a.cooktopType.slice(-2) === '90',
    fridgeLength = 0.52

  var nLength, elNum, remainder, elLength
  elLength = a.elementLength
  nLength = a.l + (a.fridge ? (elLength - fridgeLength) * 2 : 0) + (cooktop && largeCooktop ?  elLength - 0.90 : 0)
  elNum = Math.ceil(round(nLength / elLength, 100))
  remainder = round(elLength - (elNum * elLength - nLength), 100)
  return {elementNum: elNum, remainder: remainder}
}

function updatePositions(a, config) {
  var
    cooktop = a.cooktopType !== 'none',
    largeCooktop = cooktop && a.cooktopType.slice(-2) === '90',
    fridgeLength = 0.52
  //console.log('cooktop', _.clone(a.cooktopPos), elements && _.clone(elements[a.cooktopPos - 1]))
  var elements = []
  var elNum = config.elementNum
  // set all element lengths
  for (var i = 0; i < elNum; i++) {
    if (a.fridge && (i === a.fridgePos - 1 || i === a.fridgePos)) {
      elements[i] = fridgeLength
    }
    else if (cooktop && largeCooktop && i === a.cooktopPos - 1) elements[i] = 0.9
    else if (config.remainder && ((!a.highCabinetRight && i === elNum - 1) || (a.highCabinetRight > 0 && i === elNum - a.highCabinetRight - 1))) elements[i] = config.remainder
    //else if (getElementPos(elements, i) + 2 * a.elementLength <= a.l) elements[i] = a.elementLength
    else elements[i] = a.elementLength
  }
  if (!elements[0] && a.l > a.elementLength) elements[0] = a.elementLength
  else if (![elements[0]]) elements[0] = config.remainder

  return elements
}

// get x coordinate for element index
function getElementPos(elements, pos) {
  var l = 0
  for (var i = 0; i < pos - 1; i++) { l += elements[i] }
  return l
}

function round( value, factor ) {
  if (!factor) {
    return Math.round(value)
  } else {
    return Math.round(value * factor) / factor
  }
}