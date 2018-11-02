export interface Coordinate {
  row: number;
  column: number;
}

export interface MoveRequest {
  from: Coordinate;
  to: Coordinate;
}

export type State = 'promoted' | 'jumping' | 'done' | 'win' | 'lose';

export interface MoveResponse {
  state: State;
}

export type Piece = 'RK' | 'BK' | 'R' | 'B';
export type Space = Piece | null;
export type Board = Space[][];

export const defaultBoard = [
  [null, 'B', null, 'B', null, 'B', null, 'B'],
  ['B', null, 'B', null, 'B', null, 'B', null],
  [null, 'B', null, 'B', null, 'B', null, 'B'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['R', null, 'R', null, 'R', null, 'R', null],
  [null, 'R', null, 'R', null, 'R', null, 'R'],
  ['R', null, 'R', null, 'R', null, 'R', null],
] as Board;

export class Game {
  private readonly jumping: boolean = false;

  constructor(
    currentPlayerId: string,
    readonly id: number,
    readonly playerOneId: string,
    readonly playerTwoId: string,
    readonly board: Board = defaultBoard,
  ) {}

  move(move: MoveRequest, userId: string): State | null {
    const piece = this.board[move.from.row][move.from.column];

    if (piece == null) {
      return null;
    }
    if (move.to.row > move.from.row) {
      return null;
    }
    if (move.to.column < move.from.column) {
      return null;
    }
    this.board[move.to.row][move.to.column] = piece;
    this.board[move.from.row][move.from.column] = null;

    return 'done';
  }
}
