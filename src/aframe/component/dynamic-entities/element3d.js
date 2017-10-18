import wallType from './by-type/wall'
import windowType from './by-type/window'
import doorType from './by-type/door'
import polyFloorType from './by-type/polyfloor'
import cloneDeep from 'lodash/cloneDeep'
import materialDefinitions from './material-definitions/mat-lib.js'

function getElementComponent(type) {
  return {
    schema: {
      l: {
        type: 'float',
        default: null
      },
      h: {
        type: 'float',
        default: null
      },
      w: {
        type: 'float',
        default: null
      },
      materials: {
        type: 'string',
        default: ''
      },
      polygon: {
        type: 'string',
        default: ''
      }
    },

    init: function () {
    },

    update: function () {
      var this_ = this
      var el = this.el
      var data = this.data
      var l = data.l
      var h = data.h
      var w = data.w
      var materials = data.materials
      var polygon = data.polygon

      // check el3d types
      var validTypes = ['box', 'closet', 'curtain', 'polyfloor', 'stairs', 'wall', 'window', 'door']
      if (validTypes.indexOf(type) < 0) return

      // map el3d modules
      var types = {
        // 'box': boxType,
        // 'closet': closetType,
        // 'curtain': curtainType,
        'door': doorType,
        'polyfloor': polyFloorType,
        // 'stairs': stairsType,
        'wall': wallType,
        'window': windowType
      }

      var a, el3d, meshes, materials, data3d

      el3d = types[type]
      if (!el3d) return

      if (materials && materials !== '') materials = parseMats(materials)
      if (type === 'polyfloor' && polygon && polygon !== '') {
        polygon = parsePolygon(polygon)
        console.log('polygon', polygon)
      }

      // get default values
      a = el3d.params
      // apply entity values
      a = mapAttributes(a, {l, h, w, polygon})

      if (materials !== '') {
        console.log(a.type, materials)
        Object.keys(materials).forEach(key => {
          a.materials[key] = materials[key]
        })
      }

      // get children for walls
      if (type === 'wall') {
        var children = this_.el.children
        var _children = []
        if (children && children.length > 0) {
          for (var i = 0; i < children.length; i++) {
            var c = children[i].getAttribute('io3d-window') || children[i].getAttribute('io3d-door')
            if (c) {
              if (children[i].getAttribute('io3d-window')) c.type = 'window'
              else if (children[i].getAttribute('io3d-door')) c.type = 'door'
              var pos = children[i].getAttribute('position')
              Object.keys(pos).forEach(p => {
                c[p] = pos[p]
              })
              _children.push(c)
            } else console.log('invalid child')
          }

          // apply defaults and map attributes
          _children = _children.map(c => mapAttributes(cloneDeep(types[c.type].params), c))
          // console.log('children', _children)
          a.children = _children
        }
      }

      // console.log(a.type, cloneDeep(a.materials))

      // get meshes and materials from el3d modules
      meshes = el3d.meshes3d(a)
      materials = el3d.materials3d(cloneDeep(a))

      // fetch materials from mat library
      Object.keys(materials).forEach(mat => {
        materials[mat] = getMaterial(materials[mat])
      }
    )

      // construct data3d object
      data3d = {
        meshes: meshes,
        materials: materials
      }

      // remove old mesh
      this_.remove()

      // create new one
      this_.mesh = new THREE.Object3D()
      this_.data3dView = new IO3D.aFrame.three.Data3dView({parent: this_.mesh})

      // update view
      this_.data3dView.set(data3d)
      this_.el.setObject3D('mesh', this_.mesh)
      // emit event
      this_.el.emit('model-loaded', {format: 'data3d', model: this_.mesh});
    },

    remove: function () {
      if (this.data3dView) {
        this.data3dView.destroy()
        this.data3dView = null
      }
      if (this.mesh) {
        this.el.removeObject3D('mesh')
        this.mesh = null
      }
    }
  }
}

export default getElementComponent

function getMaterial(material) {
  var mat = materialDefinitions[material]
  if (!mat) return material
  var attr = cloneDeep(mat.attributes)
  Object.keys(attr).forEach(a => {
    // get textures
    if (a.indexOf('map') > -1 ) {
    // fix to prevent double slash
    if (attr[a][0] === '/') attr[a] = attr[a].substring(1)
    // get full texture path
    attr[a] = 'https://storage.3d.io/' + attr[a]
  }
})
  return attr
}

function mapAttributes(a, args) {
  // set custom attributes
  var validProps = {
    box: ['h', 'l', 'w'],
    closet: ['h', 'l', 'w'],
    curtain: ['h', 'l', 'w'],
    door: ['h', 'l', 'w', 'x', 'y'],
    polyfloor: ['h', 'polygon'],
    stairs: ['h', 'l', 'w'],
    wall: ['h', 'l', 'w'],
    window: ['h', 'l', 'w', 'x', 'y']
  }
  var _type = a.type
  Object.keys(args).forEach(prop => {
    if (validProps[_type].indexOf(prop) > -1 && (args[prop] || args[prop] === 0)) a[prop] = args[prop]
  })
  return a
}

function parseMats(mats) {
  var _mats = mats.split(',')
  var matObj = {}
  _mats.forEach(m => {
    var key = m.split('=')[0]
    var val = m.split('=')[1]
    matObj[key] = val
  })
  return matObj
}

function parsePolygon(p) {
  var _p = p.split(',')
  var polygon = []
  for (var i = 0; i < _p.length - 1; i+=2 ) {
    polygon.push([_p[i],_p[i+1]])
  }
  return polygon
}