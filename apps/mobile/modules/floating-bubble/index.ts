// Re-export the native module. On web, it will be resolved to FloatingBubbleModule.web.ts
// and on native platforms to FloatingBubbleModule.ts
export { default } from './src/FloatingBubbleModule';
export * from './src/FloatingBubble.types';
