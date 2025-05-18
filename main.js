import * as THREE from 'three';

// MAIN MENU VIEW

// Display the logo and the buttons for Level 1 and Level 2
var logo;
placelogo(10,50);
createMenu();


// Create the main menu with buttons for Level 1 and Level 2
function createMenu() {
    const oldMenu = document.getElementById('menu');
    if (oldMenu) oldMenu.remove();
  
    const menu = document.createElement('div');
    menu.id = 'menu';
  
    const button1 = document.createElement('button');
    button1.innerText = 'L1 - Vag Crash';
    button1.onclick = () => createModeMenu('level1');
  
    const button2 = document.createElement('button');
    button2.innerText = 'L2 - Uterus Splash';
    button2.onclick = () => createModeMenu('level2');
  
    menu.appendChild(button1);
    menu.appendChild(button2);
    document.body.appendChild(menu);
}
  
// Create the mode menu with buttons for Story Mode and Survival Mode
function createModeMenu(levelName) {
  const oldMenu = document.getElementById('menu');
  if (oldMenu) oldMenu.remove();

  const modeMenu = document.createElement('div');
  modeMenu.id = 'menu';

  const mode1 = document.createElement('button');
  mode1.innerText = 'Story Mode';
  // On click, load the selected level on story mode
  mode1.onclick = () => startLevel(`${levelName}_story_mode`);

  const mode2 = document.createElement('button');
  mode2.innerText = 'Survival Mode';
  // On click, load the selected level on survival mode
  mode2.onclick = () => startLevel(`${levelName}_survival_mode`);

  const goBack = document.createElement('button');
  goBack.innerText = 'Go Back';
  goBack.classList.add('go-back');
  goBack.onclick = () => createMenu();

  modeMenu.appendChild(mode1);
  modeMenu.appendChild(mode2);
  modeMenu.appendChild(goBack);

  document.body.appendChild(modeMenu);
}

// Start the selected level
function startLevel(levelName) {
    const menu = document.getElementById('menu');
    menu.remove();
    logo.remove();
    import(`./${levelName}.js`);
}

// Place the game's logo on the screen
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
  