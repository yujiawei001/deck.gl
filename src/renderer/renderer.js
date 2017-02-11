import {Ray} from '../lib/utils/ray';

import {GL} from './luma.gl2/webgl2';
import {vec3, vec4, mat4} from 'gl-matrix';

import {RenderableMeshGenerator} from './renderable-mesh/generator/renderable-mesh-generator';

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

  newCamera({
    id = 'default-cam',
    type = 'perspective',
    params = {},
    targetParams = {},
    controlType = 'target'
  }) {

    let framebufferID;
    if (targetParams.renderToTexture === true) {
      framebufferID = this.framebufferManager.newFramebuffer({
        id: `${id}.targetTexture`,
        width: targetParams.width,
        height: targetParams.height
      });
    }

    this.cameraManager.newCamera({
      id,
      type,
      params,
      targetID: framebufferID,
      corner: targetParams.corner,
      controlType
    });

    this.needsRedraw = true;
  }

  /* Generating renderable geometry from abstract geometry.
  Renderable geometry doesn't need to match abstract geometry but to
  maximize the rendering performance. */

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
  renderable match */

  // TODO: this should be where the MeshGenerator class kicks in.
  // Mesh->RendereableMesh generation should be like:
  // currentRenderableMesh = Text2dMeshGenerator.generate(mesh)

  regenerateRenderableMeshes({meshes}) {

    /* When data structure changed, we need to update the rendering geometries.
    Right now, rendering geometries are regenerated from ground up. This should be
    optimized to regenerating only the change part of the whole scene tree.
    Major optimization could happen here */
    for (const mesh of meshes) {
      this.renderableMeshes.set(`${mesh.id}.renderable`, RenderableMeshGenerator.generate({mesh, renderer: this})
      );
      // Clear the flag
      mesh.generated = true;
    }
    this.needsRedraw = true;
    //   // Optimizing renderingGeometries
    //   // TODO
  }

  /* TODO: This function will be significantly improved */
  updateRenderableMeshes(properties) {
    for (const [meshID, propertiesOfMesh] of properties) {
      this.renderableMeshes.get(`${meshID}.renderable`).updateAttributes({
        properties: propertiesOfMesh
      });

      // Clear the dirty flag
      for (const property of propertiesOfMesh.values()) {
        property.dirty = false;
      }
    }

    if (properties.size !== 0) {
      this.needsRedraw = true;
    }
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
    //console.log("Draw completed. Frame No. ", this.frameNo);

    this.needsRedraw = false;
    this.frameNo++;
  }

  renderCameraTargetsToScreen() {
    const gl = this.glContext;
    this.framebufferManager.bindFramebuffer(null);

    const screenQuadProgram = this.programManager.getProgramByID('screenQuad');
    screenQuadProgram.use();
    let renderOrder = 0;
    for (const cameraID of this.cameraManager.cameras.keys()) {
      // Get current camera and set appropriate framebuffer
      const buffer0 = this.cameraManager.getBuffer(cameraID, 'vertices');
      const buffer1 = this.cameraManager.getBuffer(cameraID, 'texCoords');
      const buffer2 = this.cameraManager.getBuffer(cameraID, 'index');
      const tex = this.cameraManager.getTargetTexture(cameraID);

      /* left hand coord is used for NDC space */

      screenQuadProgram.setBuffers({
        vertices: buffer0,
        texCoords: buffer1,
        index: buffer2
      });

      screenQuadProgram.setUniforms({
        colorTex: tex,
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
