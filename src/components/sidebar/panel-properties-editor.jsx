import React, {PropTypes, Component} from 'react';
import Panel from './panel.jsx';
import {Map, Seq} from 'immutable';
import {MODE_IDLE, MODE_3D_VIEW, MODE_3D_FIRST_PERSON} from '../../constants';

export default function PanelPropertiesEditor({scene, mode}) {

  if (![MODE_IDLE, MODE_3D_VIEW, MODE_3D_FIRST_PERSON].includes(mode)) return null;

  let componentRenderer = (element, layer) =>
    <Panel key={element.id} name={`Properties: [${element.type}] ${element.id}`}>
      <div style={{padding: "5px 15px 5px 15px"}}>
        <PropertiesEditor element={element} layer={layer}/>
      </div>
    </Panel>;

  let layerRenderer = layer => Seq()
    .concat(layer.lines)
    .concat(layer.holes)
    .concat(layer.areas)
    .concat(layer.items)
    .filter(element => element.selected)
    .map(element => componentRenderer(element, layer))
    .valueSeq();

  return <div>{scene.layers.valueSeq().map(layerRenderer)}</div>

}

PanelPropertiesEditor.propTypes = {
  scene: PropTypes.object.isRequired,
  mode: PropTypes.string.isRequired
};


/**** PROPERTIES EDITOR ****/
const STYLE_WRAPPER_BUTTONS = {textAlign: "right"};
const STYLE_BUTTON_UNSELECT = {backgroundColor: "gray", border: 0, color: "white", margin: "3px"};
const STYLE_BUTTON_RESET = {backgroundColor: "gray", border: 0, color: "white", margin: "3px"};
const STYLE_BUTTON_SAVE = {backgroundColor: "green", border: 0, color: "white", margin: "3px"};
const STYLE_BUTTON_REMOVE = {backgroundColor: "red", border: 0, color: "white", margin: "3px"};

class PropertiesEditor extends Component {

  constructor(props, context) {
    super(props, context);
    this.calculateDefaultState = this.calculateDefaultState.bind(this);
    this.reset = this.reset.bind(this);
    this.save = this.save.bind(this);
    this.updateProperty = this.updateProperty.bind(this);
    this.state = this.calculateDefaultState();
  }

  calculateDefaultState() {
    let {element} = this.props;
    let {catalog} = this.context;

    let catalogElement = catalog.getElement(element.type);

    return Seq(catalogElement.properties).map((configs, propertyName) => {

      let currentValue = element.properties.has(propertyName) ? element.properties.get(propertyName) : configs.defaultValue;
      currentValue = currentValue instanceof Object ? new Map(currentValue) : currentValue;

      return {
        currentValue,
        inputElement: configs.type,
        configs
      }
    }).toJS();
  }

  updateProperty(propertyName, value) {
    this.setState({
      [propertyName]: {
        ...this.state[propertyName],
        currentValue: value
      }
    });
  }

  reset() {
    let state = this.calculateDefaultState();
    this.setState(state);
  }

  save() {
    let {state} = this;
    let {element, layer} = this.props;
    let {editingActions, catalog} = this.context;

    let properties = Seq(state).map(configs => configs.currentValue).toMap().toJS();
    editingActions.setProperties(properties);
  }

  render() {
    let {state, context: {editingActions, catalog}} = this;

    let renderInputElement = (inputElement, propertyName, value, configs)=> {
      let {Viewer, Editor} = catalog.propertyTypes[inputElement];

      return React.createElement(Viewer, {
        key: propertyName,
        propertyName,
        value,
        configs,
        onUpdate: value => this.updateProperty(propertyName, value)
      });
    };

    return (
      <div>
        { Seq(state).entrySeq().map(([propertyName, {currentValue, inputElement, configs}]) =>
          renderInputElement(inputElement, propertyName, currentValue, configs)) }

        <div style={STYLE_WRAPPER_BUTTONS}>
          <button style={STYLE_BUTTON_UNSELECT} onClick={event => editingActions.unselectAll()}>Unselect</button>
          <button style={STYLE_BUTTON_REMOVE} onClick={event => editingActions.remove()}>Remove</button>
          <button style={STYLE_BUTTON_RESET} onClick={event => this.reset()}>Reset</button>
          <button style={STYLE_BUTTON_SAVE} onClick={event => this.save()}>Save</button>
        </div>
      </div>
    )
  }

}

PropertiesEditor.propTypes = {
  element: PropTypes.object.isRequired,
  layer: PropTypes.object.isRequired
};

PropertiesEditor.contextTypes = {
  editingActions: PropTypes.object.isRequired,
  catalog: PropTypes.object.isRequired
};
