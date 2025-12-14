
export class Input {
  constructor() {
    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      a: false,
      s: false,
      d: false,
      q: false,
      ' ': false
    };
    this.pressed = {};

    const codeMap = {
      'KeyW': 'w',
      'KeyA': 'a',
      'KeyS': 's',
      'KeyD': 'd',
      'KeyQ': 'q',
      'Space': ' ',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight'
    };

    window.addEventListener('keydown', (e) => {
      // Check code first for physical position
      const mapped = codeMap[e.code];
      let key = null;
      if (mapped && this.keys.hasOwnProperty(mapped)) {
        key = mapped;
      } else if (this.keys.hasOwnProperty(e.key)) {
        key = e.key;
      }

      if (key) {
        if (!this.keys[key]) {
          this.pressed[key] = true;
        }
        this.keys[key] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const mapped = codeMap[e.code];
      if (mapped && this.keys.hasOwnProperty(mapped)) {
        this.keys[mapped] = false;
      } else if (this.keys.hasOwnProperty(e.key)) {
        this.keys[e.key] = false;
      }
    });
  }

  isDown(key) {
    return this.keys[key];
  }

  isPressed(key) {
    return this.pressed[key];
  }

  update() {
    this.pressed = {};
  }

  get axis() {
    const x = (this.keys.ArrowRight || this.keys.d ? 1 : 0) - (this.keys.ArrowLeft || this.keys.a ? 1 : 0);
    const y = (this.keys.ArrowDown || this.keys.s ? 1 : 0) - (this.keys.ArrowUp || this.keys.w ? 1 : 0);
    return { x, y };
  }
}
