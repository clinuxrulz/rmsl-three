import { RawShaderMaterial, GLSL3, type MaterialParameters, Color, Matrix4 } from 'three';
import { compileGLSL, type Node, type ShaderType, type UniformNode } from '@random-mesh/rmsl';

interface RMSLShaderMaterialParameters extends MaterialParameters {
  vertex: Node<ShaderType> | Node<ShaderType>[] | (() => Node<ShaderType> | Node<ShaderType>[] | void);
  fragment: Node<ShaderType> | Node<ShaderType>[] | (() => Node<ShaderType> | Node<ShaderType>[] | void);
  uniforms?: Record<string, { value: any }>;
}

export class RMSLShaderMaterial extends RawShaderMaterial {
  // RMSL-generated vertex attribute slot names (e.g. "_rmsl_a0").
  public attributeSlots!: string[];

  constructor(params: RMSLShaderMaterialParameters) {
    const { vertex, fragment, uniforms: userUniforms, ...rest } = params;
    
    const rawVResult = typeof vertex === 'function' ? vertex() : vertex;
    const rawFResult = typeof fragment === 'function' ? fragment() : fragment;
    
    const vResult = (rawVResult ?? []) as Node<ShaderType> | Node<ShaderType>[];
    const fResult = (rawFResult ?? []) as Node<ShaderType> | Node<ShaderType>[];
    
    const vsGLSL = stripVersion(compileGLSL.vertex(vResult));
    const fsGLSL = stripVersion(compileGLSL.fragment(fResult));
    
    const uniformDefs = extractUniforms(vsGLSL, fsGLSL);
    
    // Exclude built-in three.js uniforms; three.js populates these automatically
    // via p_uniforms.setValue() at render time.  If we include them in
    // material.uniforms, WebGLUniforms.upload() overrides the correct values
    // with our placeholder (identity/uninitialised) data.
    const builtins = new Set([
      'projectionMatrix', 'modelViewMatrix', 'modelMatrix',
      'viewMatrix', 'normalMatrix', 'cameraPosition', 'isOrthographic',
    ]);
    
    const uniforms: Record<string, { value: any }> = {};
    for (const name of uniformDefs) {
      if (builtins.has(name)) continue;
      // Use user-provided value or sensible default (null, Color, etc.)
      uniforms[name] = userUniforms?.[name] ?? { value: inferDefaultValue(name) };
    }
    
    super({
      vertexShader: vsGLSL,
      fragmentShader: fsGLSL,
      uniforms,
      glslVersion: GLSL3,
      ...rest,
    });

    this.attributeSlots = extractAttributes(vsGLSL);
  }

  public setUniform(name: string, value: any) {
    if (this.uniforms && this.uniforms[name]) {
      this.uniforms[name].value = value;
    } else {
      console.warn(`RMSLShaderMaterial: Uniform '${name}' not found.`);
    }
  }

  public setUniformByRef(uniformNode: UniformNode<any>, value: any) {
    this.setUniform(uniformNode.name, value);
  }

  /**
   * three.js binds geometry attributes to shader `in` variables by matching
   * names. RMSL auto-names its attributes (e.g. "_rmsl_a0"), which never match
   * the geometry's "position"/"normal"/"uv" buffers, so they receive no data and
   * the mesh collapses to a point (invisible). Call this with a geometry to
   * alias the standard attributes onto the RMSL slot names so the real vertex
   * data is bound.
   */
  public attachGeometry(geometry: { getAttribute: (n: string) => any; setAttribute: (n: string, a: any) => void }): void {
    const standard = ['position', 'normal', 'uv', 'uv1', 'color', 'tangent'];
    for (const slot of this.attributeSlots) {
      for (const name of standard) {
        const attr = geometry.getAttribute(name);
        if (attr) {
          geometry.setAttribute(slot, attr);
          break;
        }
      }
    }
  }

  // For ShaderMaterial, the uniforms property is managed by the base class. 
  // Accessing 'this.uniforms' directly after super() should be fine.
  // No explicit 'declare' needed here. This comment is for clarity.
}

// RMSL emits its own "#version 300 es" directive, but three.js (ShaderMaterial
// with glslVersion: GLSL3) prepends its own version line at the very top of the
// final shader. A second #version directive anywhere but the first line is a
// compile error, so strip RMSL's directive and let three.js supply it.
function stripVersion(glsl: string): string {
  return glsl.replace(/^\s*#version\s+\d+\s*(es)?\s*\n/, '');
}

// Extracts uniform names from compiled shader code
function extractUniforms(...shaders: string[]): string[] {
  const names = new Set<string>();
  const regex = /uniform\s+\w+\s+(\w+);/g;
  for (const shader of shaders) {
    let match;
    while ((match = regex.exec(shader)) !== null) {
      names.add(match[1]);
    }
  }
  return [...names];
}

// Extracts RMSL vertex-attribute slot names (e.g. "_rmsl_a0") from the
// compiled vertex shader so they can be bound to the geometry's buffers.
function extractAttributes(vertexShader: string): string[] {
  const names = new Set<string>();
  const regex = /(?:^|\n)\s*in\s+\w+\s+(\w+)\s*;/g;
  let match;
  while ((match = regex.exec(vertexShader)) !== null) {
    names.add(match[1]);
  }
  return [...names].filter((n) => n.startsWith('_rmsl_a'));
}

// Infers a default value based on uniform name or type (basic heuristic)
function inferDefaultValue(uniformName: string): any {
  // Basic heuristic: check for common types in the uniform name
  if (uniformName.toLowerCase().includes('color')) return new Color(0xffffff);
  if (uniformName.toLowerCase().includes('matrix')) return new Matrix4(); // three.js auto-populates these
  if (uniformName.toLowerCase().includes('time')) return 0;
  // More sophisticated inference could check the RMSL UniformNode's type
  return null; // Default to null for unknown types
}
