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
      style: { default: 'width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 12px; margin: 1.5rem 0; box-shadow: 0 4px 24px rgba(0,0,0,0.25); display: block; object-fit: contain;' },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'video',
        getAttrs: node => ({
          src: node.querySelector('source')?.getAttribute('src'),
          type: node.querySelector('source')?.getAttribute('type'),
          controls: node.hasAttribute('controls'),
          style: node.getAttribute('style'),
        }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, { controls: true }),
      [
        'source',
        {
          src: HTMLAttributes.src,
          type: HTMLAttributes.type || 'video/mp4',
        },
      ],
      'Your browser does not support the video tag.',
    ];
  },
});
