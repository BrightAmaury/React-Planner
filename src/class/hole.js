import { Layer, Group } from './export';
import { LayerOperations, history } from '../utils/export';

class Hole{

  static select( state, layerID, holeID ){
    state = state.mergeIn(['scene'], {
      layers: state.alterate ? state.scene.layers : state.scene.layers.map(LayerOperations.unselectAll),
      selectedLayer: layerID
    });

    state = Layer.select( state, layerID, 'holes', holeID ).updatedState;

    state = state.merge({
      sceneHistory: history.historyPush( state.sceneHistory, state.scene )
    });

    return {updatedState: state};
  }

  static remove( state, layerID, holeID ) {
    let hole = state.getIn(['scene', 'layers', layerID, 'holes', holeID]);
    state = this.unselect( state, layerID, holeID ).updatedState;
    state = Layer.removeElement( state, layerID, 'holes', holeID ).updatedState;

    state = state.updateIn(['scene', 'layers', layerID, 'lines', hole.line, 'holes'], holes => {
      let index = holes.findIndex(ID => holeID === ID);
      return index !== -1 ? holes.remove(index) : holes;
    });

    state.getIn(['scene', 'groups']).forEach( group => state = Group.removeElement(state, group.id, layerID, 'holes', holeID).updatedState );

    state = state.merge({
      sceneHistory: history.historyPush( state.sceneHistory, state.scene )
    });

    return {updatedState: state};
  }

  static unselect( state, layerID, holeID ) {
    state = Layer.unselect( state, layerID, 'holes', holeID ).updatedState;

    state = state.merge({
      sceneHistory: history.historyPush( state.sceneHistory, state.scene )
    });

    return {updatedState: state};
  }

}

export { Hole as default };
