import './style.css'

class Chat {
  private readonly ws: WebSocket;
  private readonly nick: string;
  private element: HTMLDivElement;
  private messages: Array<{ nick: string, message: string }> = [];
  private logs: Array<string> = [];
  private status: string = 'disconnected';

  constructor(id?: string) {
    this.ws = new WebSocket('ws://grossebeut.eu:8000');
    this.nick = "websocket_" + Math.floor(Math.random() * 1000);
    this.element = document.querySelector<HTMLDivElement>(id || '#app')!;
    this.renderStatus();
    this.setupUI();
    this.init();
    this.render();
  }

  init() {
    this.ws.onopen = () => {
      this.ws.send("user websocket * * :WebSocket User");
      this.ws.send("nick " + this.nick);
    };
    // wait for the server to send PING
    this.ws.onmessage = (event) => {
      if (event.data.startsWith("PING")) {
        this.ws.send("PONG :" + event.data.split(":")[1]);
        if (this.status === 'disconnected') {
          this.ws.send("JOIN #ws");
          this.ws.send("CAP REQ :server-time");
          this.ws.send("HISTORY #ws");
          this.status = 'connected';
          this.renderStatus();
          this.render();
        }
        return;
      }
      if (event.data.startsWith("ERROR")) {
        this.logs.push(event.data);
        return;
      }
      if (!event.data.startsWith(":")) {
        this.logs.push(event.data);
        return;
      }
      if (event.data.match(new RegExp(`:.* \\d\\d\\d ${this.nick}`, 'gi')) || !event.data.match(/PRIVMSG/)) {
        this.logs.push(event.data);
        return;
      }
      const parts = event.data.split(" ");
      const nick = parts[0].split("!")[0].substring(1);
      const message = parts.slice(3).join(" ").substring(1);
      this.messages.push({ nick, message });
      this.render();
    }
    this.ws.onclose = () => {
      this.status = 'disconnected';
      this.renderStatus();
    }
  }

  getLogs() {
    return this.logs;
  }

  render() {
    this.element.innerHTML = `
      <div>
      </div>
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter your message here';
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.ws.send("PRIVMSG #ws :" + input.value);
        this.messages.push({ nick: this.nick, message: input.value });
        input.value = '';
        this.render();
      }
    });
    this.element.appendChild(input);

    const messages = document.createElement('div');
    messages.innerHTML = this.messages.map(({ nick, message }) => `
      <div>
        <span>${nick}</span>
        <span>${message}</span>
      </div>
    `).join('');
    this.element.appendChild(messages);
  }

  renderStatus() {
    const status = document.body.querySelector<HTMLDivElement>('#status')!;
    status.innerHTML = `
      <div>
        <span>${this.status}</span>
      </div>
    `;
  }

  setupUI() {
    const button = document.createElement('button');
    button.innerHTML = 'Connect';
    button.addEventListener('click', () => {
      this.init();
    });
    this.element.appendChild(button);
  }
}

// @ts-ignore
window.chat = new Chat("#app");

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
  </div>
`

