"use strict";

import React from 'react';
import ReactDOM from 'react-dom';
import Three from 'three';
import {parseData, updateScene} from './scene-creator';
import OrbitControls from './libs/orbit-controls';
import diff from 'immutablediff';

export default class Scene3DViewer extends React.Component {

  componentDidMount() {

    let editingActions = this.context.editingActions;

    let {width, height, state} = this.props;
    let data = state.scene;
    let canvasWrapper = ReactDOM.findDOMNode(this.refs.canvasWrapper);

    let scene3D = new Three.Scene();

    //RENDERER
    let renderer = new Three.WebGLRenderer();
    renderer.setClearColor(new Three.Color(0xffffff));
    renderer.setSize(width, height);

    // LOAD DATA
    let planData = parseData(data, editingActions, this.context.catalog);

    scene3D.add(planData.plan);
    scene3D.add(planData.grid);

    let aspectRatio = width / height;
    let camera = new Three.PerspectiveCamera(45, aspectRatio, 1, 300000);

    scene3D.add(camera);

    // Set position for the camera
    let cameraPositionX = -(planData.boundingBox.max.x - planData.boundingBox.min.x) / 2;
    let cameraPositionY = (planData.boundingBox.max.y - planData.boundingBox.min.y) / 2 * 10;
    let cameraPositionZ = (planData.boundingBox.max.z - planData.boundingBox.min.z) / 2;

    camera.position.set(cameraPositionX, cameraPositionY, cameraPositionZ);
    camera.up = new Three.Vector3(0, 1, 0);

    // HELPER AXIS
    let axisHelper = new Three.AxisHelper(100);
    scene3D.add(axisHelper);

    // LIGHT
    let light = new Three.AmbientLight(0xafafaf); // soft white light
    scene3D.add(light);

    // Add another light

    let spotLight1 = new Three.SpotLight(0xffffff, 0.30);
    spotLight1.position.set(cameraPositionX, cameraPositionY, cameraPositionZ);
    scene3D.add(spotLight1);

    // OBJECT PICKING
    let toIntersect = [planData.plan];
    let mouse = new Three.Vector2();
    let raycaster = new Three.Raycaster();

    renderer.domElement.addEventListener('mousedown', (event) => {
      this.lastMousePosition.x = event.offsetX / this.width * 2 - 1;
      this.lastMousePosition.y = -event.offsetY / this.height * 2 + 1;
    }, false);

    renderer.domElement.addEventListener('mouseup', (event) => {
      event.preventDefault();

      mouse.x = (event.offsetX / this.width) * 2 - 1;
      mouse.y = -(event.offsetY / this.height) * 2 + 1;

      if (Math.abs(mouse.x - this.lastMousePosition.x) <= 0.02 && Math.abs(mouse.y - this.lastMousePosition.y) <= 0.02) {

        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(toIntersect, true);

        if (intersects.length > 0) {
          intersects[0].object.interact && intersects[0].object.interact();
        } else {
          editingActions.unselectAll();
        }
      }
    }, false);

    // add the output of the renderer to the html element
    canvasWrapper.appendChild(renderer.domElement);

    // create orbit controls
    let orbitController = new OrbitControls(camera, renderer.domElement);


    /************************************/
    /********* SCENE EXPORTER ***********/
    /************************************/

    let exportScene = () => {

      let convertToBufferGeometry = (geometry) => {
        console.log("geometry = ", geometry);
        let bufferGeometry = new Three.BufferGeometry().fromGeometry(geometry);
        return bufferGeometry;
      };

      scene3D.remove(planData.grid);

      scene3D.traverse((child) => {
        console.log(child);
        if (child instanceof Three.Mesh && !(child.geometry instanceof Three.BufferGeometry))
          child.geometry = convertToBufferGeometry(child.geometry);
      });

      let output = scene3D.toJSON();

      output = JSON.stringify(output, null, '\t');
      output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');

      let name = prompt('insert file name');
      name = name.trim() || 'scene';
      let blob = new Blob([output], {type: 'text/plain'});

      let fileOutputLink = document.createElement('a');
      let url = window.URL.createObjectURL(blob);
      fileOutputLink.setAttribute('download', name);
      fileOutputLink.href = url;
      document.body.appendChild(fileOutputLink);
      fileOutputLink.click();
      document.body.removeChild(fileOutputLink);

      scene3D.add(planData.grid);

    };

    window.exportScene = exportScene;


    /************************************/


    /************************************/
    /********** PLAN EXPORTER ***********/
    /************************************/


    let exportPlan = () => {

      let convertToBufferGeometry = (geometry) => {
        console.log("geometry = ", geometry);
        let bufferGeometry = new Three.BufferGeometry().fromGeometry(geometry);
        return bufferGeometry;
      };

      planData.plan.traverse((child) => {
        console.log(child);
        if (child instanceof Three.Mesh && !(child.geometry instanceof Three.BufferGeometry))
          child.geometry = convertToBufferGeometry(child.geometry);
      });

      let output = planData.plan.toJSON();

      output = JSON.stringify(output, null, '\t');
      output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');

      let name = prompt('insert file name');
      name = name.trim() || 'plan';
      let blob = new Blob([output], {type: 'text/plain'});

      let fileOutputLink = document.createElement('a');
      let url = window.URL.createObjectURL(blob);
      fileOutputLink.setAttribute('download', name);
      fileOutputLink.href = url;
      document.body.appendChild(fileOutputLink);
      fileOutputLink.click();
      document.body.removeChild(fileOutputLink);

      scene3D.add(planData.grid);

    };

    window.exportPlan = exportPlan;

    /************************************/


    render();
    function render() {
      orbitController.update();

      spotLight1.position.set(camera.position.x, camera.position.y, camera.position.z);
      camera.updateMatrix();
      camera.updateMatrixWorld();

      renderer.render(scene3D, camera);
      requestAnimationFrame(render);
    }

    this.lastMousePosition = {};
    this.orbitControls = orbitController;
    this.renderer = renderer;
    this.camera = camera;
    this.scene3D = scene3D;
    this.planData = planData;
    this.width = width;
    this.height = height;
  }

  componentWillUnmount() {
    this.orbitControls.dispose();
  }

  componentWillReceiveProps(nextProps) {
    let {width, height} = nextProps;
    let {camera, renderer, scene3D} = this;

    this.width = width;
    this.height = height;

    let aspectRatio = width / height;
    camera.aspect = aspectRatio;

    camera.updateProjectionMatrix();

    if (nextProps.state.scene !== this.props.state.scene) {

      let changedValues = diff(this.props.state.scene, nextProps.state.scene);

      updateScene(this.planData, nextProps.state.scene, changedValues.toJS(), this.context.editingActions, this.context.catalog);
    }

    renderer.setSize(width, height);
    renderer.render(scene3D, camera);
  }

  render() {
    return React.createElement("div", {
      ref: "canvasWrapper"
    });
  }
}

Scene3DViewer.propTypes = {
  state: React.PropTypes.object.isRequired,
  width: React.PropTypes.number.isRequired,
  height: React.PropTypes.number.isRequired
};

Scene3DViewer.contextTypes = {
  editingActions: React.PropTypes.object.isRequired,
  catalog: React.PropTypes.object
};
