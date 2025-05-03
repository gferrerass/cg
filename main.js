import * as THREE from 'three';

createMenu();

function createMenu() {
  const menu = document.createElement('div');
  menu.id = 'menu';

  const button1 = document.createElement('button');
  button1.innerText = 'Level 1';
  button1.onclick = () => startLevel('level1');

  const button2 = document.createElement('button');
  button2.innerText = 'Level 2';
  button2.onclick = () => startLevel('level2');

  menu.appendChild(button1);
  menu.appendChild(button2);
  document.body.appendChild(menu);
}

function startLevel(levelName) {
  const menu = document.getElementById('menu');
  if (menu) menu.remove();
  import(`./${levelName}.js`);
}
