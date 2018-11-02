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

export type Color = 'D' | 'L';
export type Piece = 'DK' | 'LK' | Color;
export const dark: Color = 'D';
export const light: Color = 'L';
export const darkKing: Piece = 'DK';
export const lightKing: Piece = 'LK';
export type Space = Piece | null;
export type Board = Space[][];

export const defaultBoard = [
  [null, dark, null, dark, null, dark, null, dark],
  [dark, null, dark, null, dark, null, dark, null],
  [null, dark, null, dark, null, dark, null, dark],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [light, null, light, null, light, null, light, null],
  [null, light, null, light, null, light, null, light],
  [light, null, light, null, light, null, light, null],
] as Board;

export class Game {
  board: Board;
  readonly jumping: boolean = false;

  constructor(
    public currentColor: Color,
    readonly id: number,
    readonly darkId: string,
    readonly lightId: string,
    board?: Board,
  ) {
    if (board) {
      this.board = board;
    } else {
      this.board = JSON.parse(JSON.stringify(defaultBoard));
    }
  }

  move(move: MoveRequest): State | null {
    const piece = this.board[move.from.row][move.from.column];

    if (piece == null) {
      return null;
    }

    if (!piece.startsWith(this.currentColor)) {
      return null;
    }

    if (move.from.row === move.to.row || move.from.column === move.to.column) {
      return null;
    }

    if (!piece.endsWith('K')) {
      if (this.currentColor === dark && move.from.row > move.to.row) {
        return null;
      }

      if (this.currentColor === light && move.from.row < move.to.row) {
        return null;
      }
    }

    this.board[move.to.row][move.to.column] = piece;
    this.board[move.from.row][move.from.column] = null;
    this.currentColor = this.currentColor === light ? dark : light;

    return 'done';
  }
}
