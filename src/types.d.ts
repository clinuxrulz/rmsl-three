// Local type declarations for three.js submodules that @types/three doesn't fully export

// Declare three/tsl module (which is an alias for three.webgpu in three.js 0.170+)
declare module 'three/tsl' {
  import { Node, ShaderNodeObject } from 'three/src/nodes/core/Node.js';
  import { NodeBuilder } from 'three/src/nodes/core/NodeBuilder.js';

  // TSL functions
  export function glslFn(code: string, includes?: any): (...params: Record<string, Node>) => ShaderNodeObject<Node>;
  export function wgslFn(code: string, includes?: any): (...params: Record<string, Node>) => ShaderNodeObject<Node>;

  // TSL base types and functions
  export type Node = any;
  export type ShaderNodeObject<T> = any;

  // Common TSL nodes
  export const positionLocal: Node;
  export const uv: () => Node;
  export const color: Node;
  export const modelViewMatrix: Node;
  export const projectionMatrix: Node;
  export const cameraProjectionMatrix: Node;
  export const modelViewProjection: Node;
  export const normalLocal: Node;
  export const attribute: (name: string, type?: string) => Node;
  export const varying: (node: Node | string, name?: string) => Node;
  export const varyingProperty: (type: string, name: string) => Node;
  export const uniform: (value: any) => Node;
  export const Fn: <T extends any[], R>(fn: (...args: T) => R) => (...args: T) => ShaderNodeObject<R>;
  export const If: (cond: Node, body: () => void) => any;
  export const Loop: (body: () => void) => void;
  export const While: (cond: Node, body: () => void) => void;
  export const For: <T extends Node>(init: () => T, cond: (v: T) => Node, update: (v: T) => void, body: (v: T) => void) => void;
  export const Return: (value: Node) => void;
  export const Discard: () => void;
  export const Break: () => void;
  export const Continue: () => void;

  // Math operations
  export const add: (a: Node, b: Node) => Node;
  export const sub: (a: Node, b: Node) => Node;
  export const mul: (a: Node, b: Node) => Node;
  export const div: (a: Node, b: Node) => Node;
  export const sin: (x: Node) => Node;
  export const cos: (x: Node) => Node;
  export const tan: (x: Node) => Node;
  export const mix: (a: Node, b: Node, t: Node) => Node;
  export const clamp: (value: Node, min: Node, max: Node) => Node;
  export const dot: (a: Node, b: Node) => Node;
  export const cross: (a: Node, b: Node) => Node;
  export const length: (x: Node) => Node;
  export const normalize: (x: Node) => Node;

  // Vector constructors
  export const float: (x: number | Node) => Node;
  export const vec2: (x: number | Node, y?: number | Node) => Node;
  export const vec3: (x: number | Node, y?: number | Node, z?: number | Node) => Node;
  export const vec4: (x: number | Node, y?: number | Node, z?: number | Node, w?: number | Node) => Node;
  export const int: (x: number | Node) => Node;
  export const uint: (x: number | Node) => Node;
  export const bool: (x: boolean | Node) => Node;
  export const mat2: (...args: any[]) => Node;
  export const mat3: (...args: any[]) => Node;
  export const mat4: (...args: any[]) => Node;

  // Texture and sampling
  export const texture: (texture: any, coords: Node) => Node;
  export const sampler: (texture: any) => Node;

  // Timer
  export const timerLocal: () => Node;
  export const timerGlobal: () => Node;
  export const timerDelta: () => Node;

  // Other common nodes
  export const modelViewPosition: () => Node;
  export const modelWorldMatrix: () => Node;
  export const cameraPosition: () => Node;
  export const cameraNear: () => Node;
  export const cameraFar: () => Node;
}

// three/webgpu is the same as three/tsl in this version
declare module 'three/webgpu' {
  export * from 'three/tsl';
  export { default as NodeMaterial } from 'three/src/materials/nodes/NodeMaterial.js';
  export { default as WebGPURenderer } from 'three/src/renderers/webgpu/WebGPURenderer.js';
  export { default as WebGPUBackend } from 'three/src/renderers/webgpu/WebGPUBackend.js';
}
