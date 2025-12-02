const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scoreEl = document.getElementById('exp-score');
const levelEl = document.getElementById('level-display');
const expBarEl = document.getElementById('exp-bar');

const world = {
    width: 2000,
    height: 2000
};

const buildings = [];
const vehicles = []; // Abandoned helicopters and planes

export { canvas, ctx, scoreEl, levelEl, expBarEl, world, buildings, vehicles };
