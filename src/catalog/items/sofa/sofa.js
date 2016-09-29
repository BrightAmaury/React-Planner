import Three from 'three';
import {loadObjWithMaterial} from '../../../utils/load-obj';
import path from 'path';

import React from 'react';

let rectSVG = React.createFactory('rect');
let gSVG = React.createFactory('g');
let textSVG = React.createFactory('text');

export default {
  name: "sofa",
  prototype: "items",

  info: {
    tag: ['arredamento', 'pelle'],
    group: "Items",
    description: "Divano in pelle",
    image: require('./sofa.png')
  },

  properties: {},

  render2D: function (element, layer, scene) {
    return gSVG({}, [
      rectSVG({
        key: 1,
        x: 0,
        y: 0,
        width: element.width,
        height: element.height,
        style: {stroke: "black", strokeWidth: "2px", fill: "#84e1ce"}
      }),
      textSVG({
        key: 2,
        x: 0,
        y: 0,
        transform: `translate(${element.width / 2}, ${element.height / 2}) scale(1,-1)`,
        style: {textAnchor: "middle", fontSize: "11px"},
      }, element.type)
    ]);
  },

  render3D: function (element, layer, scene) {

    let onLoadItem = (object) => {

      let boundingBox = new Three.Box3().setFromObject(object);

      let initialWidth = boundingBox.max.x - boundingBox.min.x;
      let initialHeight = boundingBox.max.y - boundingBox.min.y;
      let initialThickness = boundingBox.max.z - boundingBox.min.z;

      object.scale.set(element.width / initialWidth, 1, element.height / initialThickness);

      if (element.selected) {
        let box = new Three.BoxHelper(object, 0x99c3fb);
        box.material.linewidth = 2;
        box.material.depthTest = false;
        object.add(box);
      }
      return object;
    };

    let mtl = require('./sofa.mtl');
    let obj = require('./sofa.obj');
    let img = require('./texture.jpg');

    return loadObjWithMaterial(mtl, obj, path.dirname(img) + '/')
      .then(object => onLoadItem(object))
  }

};
