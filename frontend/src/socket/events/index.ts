import type { GameClientToServerEvents, GameServerToClientEvents } from './game.events';
import type { ChallengeClientToServerEvents, ChallengeServerToClientEvents } from './challenge.events';
import type { FriendServerToClientEvents } from './friend.events';

export * from './game.events';
export * from './challenge.events';
export * from './friend.events';

export interface ClientToServerEvents
  extends GameClientToServerEvents,
    ChallengeClientToServerEvents {}

export interface ServerToClientEvents
  extends GameServerToClientEvents,
    ChallengeServerToClientEvents,
    FriendServerToClientEvents {}