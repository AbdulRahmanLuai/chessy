// src/socket/events/index.ts

import type { GameClientToServerEvents, GameServerToClientEvents } from './game.events';
import type { ChallengeClientToServerEvents, ChallengeServerToClientEvents } from './challenge.events';
import type { FriendServerToClientEvents } from './friend.events';
import type {
  ComputerGameClientToServerEvents,
  ComputerGameServerToClientEvents,
} from './computerGame.events';

export * from './game.events';
export * from './challenge.events';
export * from './friend.events';
export * from './computerGame.events';

export interface ClientToServerEvents
  extends GameClientToServerEvents,
    ChallengeClientToServerEvents,
    ComputerGameClientToServerEvents {}

export interface ServerToClientEvents
  extends GameServerToClientEvents,
    ChallengeServerToClientEvents,
    FriendServerToClientEvents,
    ComputerGameServerToClientEvents {}