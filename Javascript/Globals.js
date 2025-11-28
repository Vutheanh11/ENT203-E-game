const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scoreEl = document.getElementById('exp-score');
const levelEl = document.getElementById('level-display');
const expBarEl = document.getElementById('exp-bar');

export { canvas, ctx, scoreEl, levelEl, expBarEl };
