import './index.less';

console.log('hello world');

const el = document.createElement('h1');
el.innerText = 'Random number: ' + Math.random();
document.body.appendChild(el);
