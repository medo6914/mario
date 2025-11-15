'use strict';

// ====== DOM Elements ======
const mainMenu = document.getElementById('main-menu');
const startBtn = document.getElementById('start-game');
const selectLevelBtn = document.getElementById('select-level');
const toggleMusicBtn = document.getElementById('toggle-music');
const lastLevelSpan = document.getElementById('last-level');
const lastScoreSpan = document.getElementById('last-score');

const gameContainer = document.getElementById('game-container');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreVal = document.getElementById('score-val');
const livesVal = document.getElementById('lives-val');
const coinsVal = document.getElementById('coins-val');
const levelNumEl = document.getElementById('level-num');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const finalScore = document.getElementById('final-score');
const btnRestart = document.getElementById('btn-restart');
const btnBackMenu = document.getElementById('btn-back-menu');

const levelSelect = document.getElementById('level-select');
const levelInput = document.getElementById('level-input');
const goLevelBtn = document.getElementById('go-level');
const closeSelectBtn = document.getElementById('close-select');

// ====== Game setup ======
const WIDTH = 960, HEIGHT = 540;
canvas.width = WIDTH; canvas.height = HEIGHT;
const TILE = 48;

const playerImg = new Image();
playerImg.src = "https://i.postimg.cc/YCHH8x7Q/Lucid-Origin-A-young-adventurer-pixel-art-character-for-a-2D-p-3-removebg-preview.png";
const bgImg = new Image();
bgImg.src = "https://i.postimg.cc/wBnFcw88/Lucid-Origin-2D-platformer-pixel-art-background-with-a-retro-s-2.jpg";

const bgMusic = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_7b7f6b78f3.mp3?filename=happy-background-116401.mp3");
bgMusic.loop = true;

const sounds = {
    jump: new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_c4e36f52f9.mp3?filename=jump-101soundboard-1-18649.mp3"),
    coin: new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_91cf9f5a16.mp3?filename=collect-1-199574.mp3"),
    die: new Audio("https://cdn.pixabay.com/download/audio/2021/10/15/audio_8a5683b5f2.mp3?filename=short-game-over-6399.mp3"),
};

// Game state
let score=0, lives=3, coinsCollected=0, gameOver=false;
let currentLevel=parseInt(localStorage.getItem('pp_level')||'1');
let player={x:120,y:0,w:40,h:48,vx:0,vy:0,speed:3.2,grounded:false,facing:1};
const gravity=0.8; let cameraX=0;

let platforms=[], coins=[], enemies=[], boss=null;
const keys={};

// ====== Controls ======
window.addEventListener('keydown', e=>{ keys[e.code]=true; if(e.code==='Space') e.preventDefault(); if(e.code==='KeyR') restartLevel(); });
window.addEventListener('keyup', e=>{ keys[e.code]=false; });

// ====== Level generator ======
function seededRandom(seed){ let t=seed%2147483647; return ()=>{t=(t*48271)%2147483647;return (t-1)/2147483646;}; }
function generateLevel(n){
    platforms=[]; coins=[]; enemies=[]; boss=null;
    const rng=seededRandom(n*1337+7);
    const cols=120, rows=10;
    for(let c=0;c<cols;c++){ if(c%Math.max(2,Math.floor(6-n/25))===0){ const y=(rows-1-Math.floor(rng()*3))*TILE; platforms.push({x:c*TILE,y:y,w:TILE,h:TILE}); } }
    for(let i=0;i<20+Math.floor(n/2);i++){ const c=Math.floor(rng()*cols), r=Math.floor(rng()*6)+2; platforms.push({x:c*TILE,y:r*TILE,w:TILE,h:TILE}); }
    for(let i=0;i<30+Math.floor(n*0.6);i++){ const c=Math.floor(rng()*cols), r=Math.floor(rng()*7)+1; coins.push({x:c*TILE+TILE*0.25,y:r*TILE+TILE*0.25,w:TILE/2,h:TILE/2,taken:false}); }
    for(let i=0;i<5+Math.floor(n/20);i++){ const c=Math.floor(rng()*cols), r=Math.floor(rng()*5)+4; enemies.push({x:c*TILE,y:r*TILE-TILE/2,w:TILE*0.8,h:TILE*0.8,vx:-1-(n/100)}); }
    if(n===100){ boss={x:cols*TILE-300,y:HEIGHT-120,w:100,h:100,vx:-1.2,life:100}; }
    const goalX=(cols-6)*TILE; return {width:cols*TILE,goalX};
}
let levelMeta = generateLevel(currentLevel);

// ???? ????? ???? ???? (physics, enemies, coins, boss, camera, drawScene, gameLoop, start/restartLevel, buttons)
// ? ?? ?????? ???? overlay, HUD, menu ?? ??????? ??????????