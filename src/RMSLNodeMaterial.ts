import { glslFn, wgslFn, uniform } from 'three/webgpu';
import { NodeMaterial } from 'three/webgpu';
import { DoubleSide, NormalBlending, FrontSide, BackSide, AdditiveBlending, SubtractiveBlending, MultiplyBlending, CustomBlending } from 'three';
import {
  compileGLSLFn,
  compileWGSLFn,
  type CompileFnOptions,
  type ShaderType as RmslShaderType,
  type Node as RmslNode,
} from '@random-mesh/rmsl';
import type { Node as ThreeNode } from 'three/webgpu';

interface RMSLStageDef {
  fn: (...args: any[]) => RmslNode<any>;
  params: CompileFnOptions['params'];
  tsl: Record<string, ThreeNode>;
}

interface RMSLNodeMaterialParameters {
  vertex: RMSLStageDef;
  fragment: RMSLStageDef;
  // Standard material options can be passed through to NodeMaterial
  transparent?: boolean;
  side?: typeof FrontSide | typeof BackSide | typeof DoubleSide;
  depthWrite?: boolean;
  depthTest?: boolean;
  blending?: typeof NormalBlending | typeof AdditiveBlending | typeof SubtractiveBlending | typeof MultiplyBlending | typeof CustomBlending;
  // ... add more as needed
}

export class RMSLNodeMaterial extends NodeMaterial {
  private _vertexGLSLCode: string;
  private _vertexWGSLCode: string;
  private _fragmentGLSLCode: string;
  private _fragmentWGSLCode: string;
  
  private _vertexTSLInputs: Record<string, ThreeNode>;
  private _fragmentTSLInputs: Record<string, ThreeNode>;
  private _uniformNodes: Map<string, ThreeNode> = new Map();

  constructor(params: RMSLNodeMaterialParameters) {
    super();
    
    // NodeMaterial properties are set directly on `this` after super() is called.
    // Note: `type` is read-only on Material, so we don't set it here.

    // Pre-compile both variants
    this._vertexGLSLCode = compileGLSLFn(params.vertex.fn, {
      name: 'vertexMain',
      params: params.vertex.params,
    });
    this._vertexWGSLCode = compileWGSLFn(params.vertex.fn, {
      name: 'vertexMain',
      params: params.vertex.params,
    });
    this._fragmentGLSLCode = compileGLSLFn(params.fragment.fn, {
      name: 'fragmentMain',
      params: params.fragment.params,
    });
    this._fragmentWGSLCode = compileWGSLFn(params.fragment.fn, {
      name: 'fragmentMain',
      params: params.fragment.params,
    });
    
    this._vertexTSLInputs = params.vertex.tsl;
    this._fragmentTSLInputs = params.fragment.tsl;

    // Track uniform nodes for setUniform
    this._collectUniformNodes(params.vertex.tsl);
    this._collectUniformNodes(params.fragment.tsl);

    // Apply standard material options
    if (params.transparent !== undefined) this.transparent = params.transparent;
    if (params.side !== undefined) this.side = params.side;
    if (params.depthWrite !== undefined) this.depthWrite = params.depthWrite;
    if (params.depthTest !== undefined) this.depthTest = params.depthTest;
    if (params.blending !== undefined) this.blending = params.blending;

    // Force needsUpdate to true on construction to ensure build is called
    this.needsUpdate = true;
  }

  private _collectUniformNodes(tslInputs: Record<string, ThreeNode>): void {
    for (const [name, node] of Object.entries(tslInputs)) {
      // Check if it's a uniform node (has a 'value' property that can be set)
      if (node && typeof node === 'object' && 'value' in node) {
        this._uniformNodes.set(name, node);
      }
    }
  }

  public setUniform(name: string, value: any): void {
    const node = this._uniformNodes.get(name);
    if (node && 'value' in node) {
      (node as any).value = value;
    } else {
      console.warn(`RMSLNodeMaterial: Uniform '${name}' not found.`);
    }
  }

  public attachGeometry(geometry: { getAttribute: (n: string) => any; setAttribute: (n: string, a: any) => void }): void {
    // For NodeMaterial/TSL approach, attributes are bound via TSL attribute nodes
    // passed in the tsl inputs. No additional geometry attachment needed.
    // This method exists for API compatibility with RMSLShaderMaterial.
  }

  // Override NodeMaterial's build method to select the correct shader variant
  // This method is called by the renderer's NodeBuilder when the material is compiled
  build( builder: any ) {
    const isWebGLBackend = builder.renderer?.backend?.isWebGLBackend === true;

    const vertexFnCallable = isWebGLBackend ? glslFn( this._vertexGLSLCode ) : wgslFn( this._vertexWGSLCode );
    const fragmentFnCallable = isWebGLBackend ? glslFn( this._fragmentGLSLCode ) : wgslFn( this._fragmentWGSLCode );

    // Call the TSL function with the provided TSL node inputs
    // Use positionNode so Three.js applies MVP transform and handles built-in varyings
    this.positionNode = vertexFnCallable( this._vertexTSLInputs ) as any;
    this.vertexNode = null;
    this.fragmentNode = fragmentFnCallable( this._fragmentTSLInputs ) as any;

    // Call the original build method to complete the material compilation
    super.build( builder );
  }
}
