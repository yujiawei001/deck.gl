import {Ray} from '../lib/utils/ray';

import {GL} from './luma.gl2/webgl2';
import {vec3, vec4, mat4} from 'gl-matrix';

// On screen WebGL renderer
export class Renderer {
  constructor({controller, canvas, debug, glOptions}) {

    this.activated = false;

    // if camera/viewport changed
    this.needsRedraw = false;

    this.frameNo = 0;

    this.currentPickingRay = null;

    this.renderableMeshes = new Map();
    // Context creation
    this.controller = controller;
    this.currentCanvas = canvas;
    this.debug = debug;
    this.contextOptions = glOptions;


    this.dpr = controller.dpr;
  }

  newPerspectiveCamera({id = 'default-cam', pos, aim, up, fovY, near, far, texture = false, width = this.currentCanvas.width, height = this.currentCanvas.height, corner, controlType}) {
    const aspect = width / height;

    let framebufferID = null;

    if (texture === true) {
      framebufferID = this.framebufferManager.newFramebuffer({
        id: id + '_target_texture',
        width,
        height
      });
    }

    this.cameraManager.newCamera({
      id,
      pos,
      aim,
      up,
      fovY,
      aspect,
      near,
      far,
      targetID: framebufferID,
      corner,
      controlType
    });

    this.needsRedraw = true;
  }

  /* Generating renderable geometry from abstract geometry.
  Renderable geometry doesn't need to match abstract geometry but to
  maximize the rendering performance. */
  regenerateRenderableMeshes(container) {

    /* When data structure changed, we need to update the rendering geometries.
    Right now, rendering geometries are regenerated from ground up. This should be
    optimized to regenerating only the change part of the whole scene tree.
    Major optimization could happen here */
    const layersToRender = container.layersToRender();
    for (let i = 0; i < layersToRender.length; i++) {
      const meshes = layersToRender[i].state.meshes;
      for (const mesh of meshes.values()) {
        this.renderableMeshes.set(`${mesh.id}_render`, this.generateRenderableMeshes(mesh));
      }
    }
    //   // Optimizing renderingGeometries
    //   // TODO
  }

  /* Generate renderable mesh from abstract mesh.
  Basically a switch statment right now.
  Most of the work are delegated to each RenderableMesh's constructor
  But eventually it will involve significant work in transforming
  abstract mesh to renderable mesh.

  This is the primary place that the user uses GPU compute to
  accelerate data transformation and mesh generation. If the user
  choose to do GPU compute here, he can use the existing drawing
  context and keep the outputs on the GPU.

  Note: abstract mesh does not need to be a 1-on-1 match with
  renderable match

  This is usually implemented in subclasses*/

  generateRenderableMeshes(mesh) {
  }

  /* This function will be significantly improved */
  updateRenderableMeshes({container, layerID, groupID, meshID, attributeID}) {
    // const geometry = this.getRenderableGeometryByID(layerID);
    // geometry.groups[groupID].meshes[meshID].updateAttribute({
    //   attributeID,
    //   mesh: container.getLayer(layerID).geometry.groups[groupID].meshes[meshID]
    // });
  }

  getRenderableGeometryByID(ID) {
    // for (let i = 0; i < this.renderableGeometries.length; i++) {
    //   if (this.renderableGeometries[i].id === ID) {
    //     return this.renderableGeometries[i];
    //   }
    // }
    return null;
  }
  /* Rendering function
  Since most of the work has been done elsewhere. This function should be
  kept very simple. Just iterate through all renderable meshes and call their
  render function
  */
  render() {
    // Render to respective framebuffers
    for (const cameraID of this.cameraManager.cameras.keys()) {
      // Get current camera and set appropriate framebuffer
      const currentCamera = this.cameraManager.getCameraAndSetTarget(cameraID);
      const cameraUniforms = currentCamera.getTransformMatrices();

      for (const renderableMesh of this.renderableMeshes.values()) {
        if (renderableMesh.cameraID === currentCamera.id || renderableMesh.cameraID === 'all') {
          renderableMesh.render(cameraUniforms);
        }
      }
    }

    this.renderCameraTargetsToScreen();
    console.log("Draw completed. Frame No. ", this.frameNo);

    this.needsRedraw = false;
    this.frameNo++;
  }

  renderCameraTargetsToScreen() {
    const gl = this.glContext;
    this.framebufferManager.bindFramebuffer(null);

    const screenQuadProgram = this.programManager.getProgram(this.programManager.getScreenQuadProgramID());
    screenQuadProgram.use();
    let renderOrder = 0;
    for (const cameraID of this.cameraManager.cameras.keys()) {
      // Get current camera and set appropriate framebuffer
      const buffer0 = this.cameraManager.getBuffer(cameraID, 'position');
      const buffer1 = this.cameraManager.getBuffer(cameraID, 'texCoords');
      const buffer2 = this.cameraManager.getBuffer(cameraID, 'index');
      const tex = this.cameraManager.getTargetTexture(cameraID);

      /* left hand coord is used for NDC space */

      screenQuadProgram.setBuffers({
        position: buffer0,
        texCoords: buffer1,
        index: buffer2
      });

      screenQuadProgram.setUniforms({
        screenTexture: tex,
        zDepth: -renderOrder * 1e-3
      });

      gl.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);

      renderOrder++;
    }
  }

  getPickingRay({screenCoord}) {
    const rayClip = vec4.fromValues(
      2.0 * screenCoord[0] * this.dpr / this.currentCanvas.width - 1.0,
      1.0 - (2.0 * screenCoord[1] * this.dpr / this.currentCanvas.height),
      1.0,
      1.0
    );

    const camera = this.cameraManager.getRenderCameraForScreenCoord({screenCoord}).camera;
    const viewProjectionMatrix = camera.getTransformMatrices().viewProjectionMatrix;
    const inverseViewProjectionMatrix = mat4.create();
    mat4.invert(inverseViewProjectionMatrix, viewProjectionMatrix);

    const rayWorldTemp = vec4.create();
    vec4.transformMat4(rayWorldTemp, rayClip, inverseViewProjectionMatrix);

    const rayWorld = vec3.fromValues(rayWorldTemp[0], rayWorldTemp[1], rayWorldTemp[2]);
    vec3.normalize(rayWorld, rayWorld);

    this.currentPickingRay = new Ray({origin: camera.getPos(), direction: rayWorld});
    return this.currentPickingRay;

  }
}
