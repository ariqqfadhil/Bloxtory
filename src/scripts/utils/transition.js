const Transition = {
  async applyTransition(contentElement, renderFunction) {
    // Gunakan View Transition API jika tersedia
    if (document.startViewTransition) {
      await document.startViewTransition(async () => {
        contentElement.innerHTML = await renderFunction();
      }).finished;
      return;
    }

    // Fallback CSS Animation
    contentElement.classList.add("fade-out");
    await new Promise((resolve) => setTimeout(resolve, 250));

    contentElement.innerHTML = await renderFunction();

    contentElement.classList.remove("fade-out");
    contentElement.classList.add("fade-in");

    setTimeout(() => {
      contentElement.classList.remove("fade-in");
    }, 300);
  },
};

export default Transition;
