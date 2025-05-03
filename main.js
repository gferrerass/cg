import * as THREE from 'three';

var logo;

placelogo(10,50);
createMenu();


function createMenu() {
    const oldMenu = document.getElementById('menu');
    if (oldMenu) oldMenu.remove();
  
    const menu = document.createElement('div');
    menu.id = 'menu';
  
    const button1 = document.createElement('button');
    button1.innerText = 'Level 1';
    button1.onclick = () => createModeMenu('level1');
  
    const button2 = document.createElement('button');
    button2.innerText = 'Level 2';
    button2.onclick = () => createModeMenu('level2');
  
    menu.appendChild(button1);
    menu.appendChild(button2);
    document.body.appendChild(menu);
  }
  
  function createModeMenu(levelName) {
    const oldMenu = document.getElementById('menu');
    if (oldMenu) oldMenu.remove();
  
    const modeMenu = document.createElement('div');
    modeMenu.id = 'menu';
  
    const mode1 = document.createElement('button');
    mode1.innerText = 'Mode 1';
    // Change when variant is added (variable or different file)
    mode1.onclick = () => startLevel(`${levelName}`);
  
    const mode2 = document.createElement('button');
    mode2.innerText = 'Mode 2';
    // Change when variant is added (variable or different file)
    mode2.onclick = () => startLevel(`${levelName}`);
  
    const goBack = document.createElement('button');
    goBack.innerText = 'Go Back';
    goBack.classList.add('go-back');
    goBack.onclick = () => createMenu();
  
    modeMenu.appendChild(mode1);
    modeMenu.appendChild(mode2);
    modeMenu.appendChild(goBack);
  
    document.body.appendChild(modeMenu);
  }

function startLevel(levelName) {
    const menu = document.getElementById('menu');
    menu.remove();
    logo.remove();
    import(`./${levelName}.js`);
}

function placelogo(positiontop, positionleft) {
    logo = document.createElement('img');
    logo.src = 'images/name_and_logo.png';
    logo.style.position = 'absolute';
    logo.style.top = `${positiontop}%`;
    logo.style.left = `${positionleft}%`;
    logo.style.transform = 'translateX(-50%)';
    logo.style.width = '450px';
  
    document.body.appendChild(logo);
  }
  