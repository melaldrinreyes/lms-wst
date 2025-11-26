import { Node, mergeAttributes } from '@tiptap/core';

export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      type: { default: 'video/mp4' },
      controls: { default: true },
      preload: { default: 'metadata' },
      playsinline: { default: true },
      style: { default: 'width: 100%; max-width: 100%; height: auto; border-radius: 12px; margin: 1.5rem 0; box-shadow: 0 4px 24px rgba(0,0,0,0.25); display: block; background: #000;' },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'video',
        getAttrs: node => ({
          src: node.getAttribute('src'),
          type: node.getAttribute('type'),
          controls: node.hasAttribute('controls'),
          style: node.getAttribute('style'),
        }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    console.log('VideoExtension renderHTML called with attributes:', HTMLAttributes);
    console.log('Video src:', HTMLAttributes.src);
    console.log('Video type:', HTMLAttributes.type);
    
    const result = [
      'video',
      mergeAttributes(HTMLAttributes, { 
        controls: true, 
        preload: 'metadata',
        playsinline: true,
        src: HTMLAttributes.src,
        style: HTMLAttributes.style || 'width: 100%; max-width: 100%; height: auto; border-radius: 12px; margin: 1.5rem 0; box-shadow: 0 4px 24px rgba(0,0,0,0.25); display: block; background: #000;'
      }),
      'Your browser does not support the video tag.',
    ];
    console.log('Video renderHTML result:', result);
    return result;
  },
});
