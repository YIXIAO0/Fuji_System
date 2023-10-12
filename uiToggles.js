document.getElementById('menu-icon').addEventListener('click', function() {
    const leftPanel = document.getElementById('left-panel');
    const content = document.getElementById('content'); // Assuming 'content' is the id for your main content
  
    if (leftPanel.style.transform === 'translateX(-100%)') {
      leftPanel.style.transform = 'translateX(0)';
      content.classList.add('blur');
    } else {
      leftPanel.style.transform = 'translateX(-100%)';
      content.classList.remove('blur');
    }
  });
  
  // Close the panel when clicking on the blurred content
  document.getElementById('content').addEventListener('click', function() {
    const leftPanel = document.getElementById('left-panel');
    if (leftPanel.style.transform === 'translateX(0)') {
      leftPanel.style.transform = 'translateX(-100%)';
      this.classList.remove('blur');
    }
  });
  