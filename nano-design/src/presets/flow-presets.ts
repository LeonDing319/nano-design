import { FlowParams } from '@/types'

export const DEFAULT_FLOW_PARAMS: FlowParams = {
  amplitude: 0.06,
  frequency: 18,
  complexity: 0,
  sharpness: 5,
  yStart: 0.4,
  speed: 0.5,
  maskAngle: -54.4,
  waveAngle: 122,
  spacerY: 1.0,
  spacerSize: 0.08,
  spacerFeather: 0.05,
}

export function randomizeFlowParams(): FlowParams {
  return {
    amplitude: Math.random() * 0.3,
    frequency: Math.floor(1 + Math.random() * 60),
    complexity: Math.random() * 5,
    sharpness: 1 + Math.random() * 15,
    yStart: Math.random(),
    speed: Math.random(),
    maskAngle: (Math.random() - 0.5) * 360,
    waveAngle: (Math.random() - 0.5) * 360,
    spacerY: Math.random(),
    spacerSize: Math.random() * 0.3,
    spacerFeather: Math.random() * 0.15,
  }
}
