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
      style: { default: null },
      videoWidth: { default: null },
      videoHeight: { default: null },
      aspectRatio: { default: null },
      poster: { default: null },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'video',
        getAttrs: node => {
          const parent = node.parentElement;
          let ar = null;
          if (parent && parent.classList && parent.classList.contains('video-wrapper')) {
            const style = parent.getAttribute('style') || '';
            const m = style.match(/aspect-ratio:\s*([^;]+)/);
            if (m) ar = m[1].trim();
          }
          return {
            src: node.getAttribute('src'),
            type: node.getAttribute('type'),
            controls: node.hasAttribute('controls'),
            style: node.getAttribute('style'),
            aspectRatio: node.getAttribute('data-aspectratio') || ar || null,
            poster: node.getAttribute('poster') || null,
          };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const wrapperAttrs = {};
    if (HTMLAttributes.aspectRatio) {
      wrapperAttrs.style = `aspect-ratio: ${HTMLAttributes.aspectRatio};`;
    }
    return [
      'div',
      mergeAttributes({ class: 'video-wrapper' }, wrapperAttrs),
      [
        'video',
        mergeAttributes(HTMLAttributes, {
          controls: true,
          preload: 'metadata',
          playsinline: true,
          src: HTMLAttributes.src,
          'data-aspectratio': HTMLAttributes.aspectRatio || undefined,
          poster: HTMLAttributes.poster || undefined,
          style: undefined // Remove inline style, use CSS
        }),
        'Your browser does not support the video tag.',
      ],
    ];
  },
});
