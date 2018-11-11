export interface Coordinate {
  row: number;
  column: number;
}

export interface MoveRequest {
  from: Coordinate;
  to: Coordinate;
}

export type State = 'promoted' | 'jumping' | 'done' | 'win';

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
  private jumpingFrom?: Coordinate;

  constructor(
    public currentColor: Color,
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
    if (
      this.jumpingFrom &&
      (move.from.row !== this.jumpingFrom.row ||
        move.from.column !== this.jumpingFrom.column)
    ) {
      return null;
    } else if (!this.isValidCoordinate(move.from)) {
      return null;
    }

    if (!this.isValidCoordinate(move.to)) {
      return null;
    }

    if (this.board[move.to.row][move.to.column]) {
      return null;
    }

    const piece = this.board[move.from.row][move.from.column];

    if (piece == null || !piece.startsWith(this.currentColor)) {
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

    const rowVector = move.to.row - move.from.row;
    const columnVector = move.to.column - move.from.column;
    const distance = Math.abs(rowVector);

    if (distance !== Math.abs(columnVector)) {
      return null;
    }

    const opponentColor = this.currentColor === light ? dark : light;
    const jumped = distance === 2;

    if (jumped) {
      const jumpedRow = move.from.row + rowVector / 2;
      const jumpedColumn = move.from.column + columnVector / 2;
      const jumpedPiece = this.board[jumpedRow][jumpedColumn];

      if (!(jumpedPiece && jumpedPiece.startsWith(opponentColor))) {
        return null;
      }

      this.board[jumpedRow][jumpedColumn] = null;
    } else if (distance !== 1) {
      return null;
    } else {
      for (const i of this.board.keys()) {
        for (const j of this.board.keys()) {
          if (this.canJumpFrom({ row: i, column: j })) {
            return null;
          }
        }
      }
    }

    const isPromotion = move.to.row === 0 || move.to.row === 7;
    this.board[move.to.row][move.to.column] = isPromotion
      ? ((piece + 'K') as Space)
      : piece;
    this.board[move.from.row][move.from.column] = null;

    if (this.isWon()) {
      return 'win';
    }

    if (jumped) {
      if (!isPromotion && this.canJumpFrom(move.to)) {
        this.jumpingFrom = move.to;
        return 'jumping';
      }

      this.jumpingFrom = undefined;
    }

    this.currentColor = opponentColor;

    return isPromotion ? 'promoted' : 'done';
  }

  private isValidCoordinate({ row, column }: Coordinate): boolean {
    return [row, column].every(i => i >= 0 && i < 8);
  }

  private isWon(): boolean {
    let sawLight = false;
    let sawDark = false;

    for (const space of ([] as Space[]).concat(...this.board)) {
      if (!space) {
        continue;
      }

      if (space.startsWith(light)) {
        sawLight = true;
      } else if (space.startsWith(dark)) {
        sawDark = true;
      }

      if (sawLight && sawDark) {
        break;
      }
    }

    return !(sawLight && sawDark);
  }

  private canJumpFrom({ row, column }: Coordinate): boolean {
    const origin = this.board[row][column];

    if (!origin || !origin.startsWith(this.currentColor)) {
      return false;
    }

    const destinations = [];

    if (origin.endsWith('K')) {
      destinations.push(
        [row - 2, column - 2],
        [row - 2, column + 2],
        [row + 2, column - 2],
        [row + 2, column + 2],
      );
    } else if (origin === light) {
      destinations.push([row - 2, column - 2], [row - 2, column + 2]);
    } else {
      destinations.push([row + 2, column - 2], [row + 2, column + 2]);
    }

    for (const [destRow, destCol] of destinations) {
      if (
        destRow < 0 ||
        destCol < 0 ||
        destRow > 7 ||
        destCol > 7 ||
        this.board[destRow][destCol]
      ) {
        continue;
      }

      const jumpedRow = row + (destRow - row) / 2;
      const jumpedCol = column + (destCol - column) / 2;
      const jumpedPiece = this.board[jumpedRow][jumpedCol];

      if (jumpedPiece && !jumpedPiece.startsWith(origin[0])) {
        return true;
      }
    }

    return false;
  }
}
