export const scrollToBottom = (element: HTMLElement | null) => {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};
