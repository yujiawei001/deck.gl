class Action {
  constructor() {
    /* action types: wheel, drag, key+drag */
    this.type = 'unknown';
    this.event = null;
    this.cameraAction = false;
    this.containerAction = false;
    // HACK
    this.standard2DCameraRatio = 1.0;
    this.AxisCameraRatio = 1.0;
  }


}

export default class EventManager {
  constructor({controller, canvas}) {
    this.target = canvas;
    this.controller = controller;

    this.target.addEventListener('wheel', this.processEvent.bind(this));
    this.target.addEventListener('mousedown', this.processEvent.bind(this));
    this.target.addEventListener('mousemove', this.processEvent.bind(this));
    this.mouseDown = false;
  }


  processEvent(event) {
    event.stopPropagation();
    event.preventDefault();
    const action = new Action();

    switch (event.type) {
      case 'wheel':
        action.event = event;
        action.type = 'wheel';
        action.cameraAction = true;
        break;
      case 'mousedown':
        this.target.addEventListener('mouseup', this.processEvent.bind(this));
        this.target.addEventListener('mouseleave', this.processEvent.bind(this));
        this.mouseDown = true;
        action.event = event;
        action.pickingAction = true;
        action.rayOnly = false;
        break;
      case 'mousemove':
        if (this.mouseDown === true) {
          action.event = event;
          action.type = "drag";
          action.cameraAction = true;
        } else {
          action.event = event;
          action.type = "hover";
          action.pickingAction = true;
          action.rayOnly = true;
        }
        break;
      case 'mouseup':
        this.target.removeEventListener('mouseup', this.processEvent.bind(this));
        this.target.removeEventListener('mouseleave', this.processEvent.bind(this));
        action.event = null;
        action.type = "cancel";
        this.mouseDown = false;
        break;
      case 'mouseleave':
        this.target.removeEventListener('mouseup', this.processEvent.bind(this));
        this.target.removeEventListener('mouseleave', this.processEvent.bind(this));
        action.event = null;
        action.type = "cancel";
        this.mouseDown = false;
        break;
    }

    if (action.cameraAction) {
      this.controller.routeCameraAction(action);
    } else if (action.pickingAction) {
      this.controller.routePickingAction(action);
    } else if (action.containerAction) {
      this.controller.routeContainerAction(action);
    } else {
      //console.log('Unknown events: ', event);
    }

  }
}
