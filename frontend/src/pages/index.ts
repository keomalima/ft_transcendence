const btn = document.getElementById('testBtn');
const output = document.getElementById('output');

btn?.addEventListener('click', async () => {
  try {
    const response = await fetch('http://localhost:3000');
    const data = await response.json();
    output!.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    output!.textContent = `Error: ${err}`;
  }
});