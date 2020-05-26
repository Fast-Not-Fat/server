import { events, payloads, PlayerStatus } from '@colobobo/library';
import { PlayerInterface, RoomInterface } from '@/types';
import { Game } from '@/classes';

export class Room implements RoomInterface {
  id: string;
  players: Map<string, PlayerInterface>;
  game: Game;

  constructor(id: string) {
    this.id = id;
    this.players = new Map();
    this.game = new Game(this);
  }

  addPlayer(player: PlayerInterface) {
    this.players.set(player.id, player);
    if (player.isCreator) this.initCreatorEventListeners(player);
    this.initEventListeners(player);
  }

  initCreatorEventListeners(player: PlayerInterface) {
    player.socket.on(events.game.start, () => this.game.start());
  }

  initEventListeners(player: PlayerInterface) {
    player.socket.on(events.player.ready, () => this.game.roundScene.playerReady(player));
    player.socket.on(events.game.positionUpdate, (e: payloads.game.PositionUpdate) =>
      this.game.roundScene.updatePosition(e),
    );
    player.socket.on('disconnect', () => {
      player.status = PlayerStatus.absent;
      // TODO: Set global status to pause

      if (!this.roomActive) {
        this.game.kill();
        global.rooms.delete(this.id);
      }
    });
  }

  get roomActive() {
    let roomActive = false;

    Array.from(this.players.values()).forEach(player => {
      if (player.status === 'active') roomActive = true;
    });

    return roomActive;
  }
}
