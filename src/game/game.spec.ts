import { dark, Game, light, lightKing, Piece } from './game';

const lightPlayer = 'p1';
const darkPlayer = 'p2';

describe('Game moves', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game(light, 0, lightPlayer, darkPlayer);
  });

  test('Player One moving into empty space', () => {
    expect(
      game.move({ from: { row: 5, column: 0 }, to: { row: 4, column: 1 } }),
    ).toBe('done');

    expect(game.board).toEqual([
      [null, dark, null, dark, null, dark, null, dark],
      [dark, null, dark, null, dark, null, dark, null],
      [null, dark, null, dark, null, dark, null, dark],
      [null, null, null, null, null, null, null, null],
      [null, light, null, null, null, null, null, null],
      [null, null, light, null, light, null, light, null],
      [null, light, null, light, null, light, null, light],
      [light, null, light, null, light, null, light, null],
    ]);
  });

  test('Player One moving into empty space', () => {
    expect(
      game.move({ from: { row: 5, column: 0 }, to: { row: 4, column: 1 } }),
    ).toBe('done');

    expect(game.board).toEqual([
      [null, dark, null, dark, null, dark, null, dark],
      [dark, null, dark, null, dark, null, dark, null],
      [null, dark, null, dark, null, dark, null, dark],
      [null, null, null, null, null, null, null, null],
      [null, light, null, null, null, null, null, null],
      [null, null, light, null, light, null, light, null],
      [null, light, null, light, null, light, null, light],
      [light, null, light, null, light, null, light, null],
    ]);
  });

  for (const move of [
    { from: { row: 5, column: 2 }, to: { row: 5, column: 1 }, dir: 'Left' },
    { from: { row: 5, column: 2 }, to: { row: 5, column: 3 }, dir: 'Right' },
    { from: { row: 5, column: 2 }, to: { row: 4, column: 2 }, dir: 'Down' },
    { from: { row: 5, column: 2 }, to: { row: 6, column: 2 }, dir: 'Up' },
  ]) {
    test(`${move.dir} Move`, () => {
      expect(game.move(move)).toBe(null);
    });
  }

  test('light cannot move dark', () => {
    expect(
      game.move({ from: { row: 2, column: 1 }, to: { row: 3, column: 2 } }),
    ).toBe(null);
  });

  test('dark cannot move light', () => {
    game.move({ from: { row: 5, column: 0 }, to: { row: 4, column: 1 } });

    expect(
      game.move({ from: { row: 4, column: 1 }, to: { row: 3, column: 2 } }),
    ).toBe(null);
  });

  for (const color of [light, dark]) {
    test('kings may move SE', () => {
      const king = (color + 'K') as Piece;
      game.board[3][3] = king;
      game.currentColor = color;

      expect(
        game.move({ from: { row: 3, column: 3 }, to: { row: 4, column: 4 } }),
      ).toBe('done');

      expect(game.board).toEqual([
        [null, dark, null, dark, null, dark, null, dark],
        [dark, null, dark, null, dark, null, dark, null],
        [null, dark, null, dark, null, dark, null, dark],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, king, null, null, null],
        [light, null, light, null, light, null, light, null],
        [null, light, null, light, null, light, null, light],
        [light, null, light, null, light, null, light, null],
      ]);

      game.currentColor = color;
      expect(
        game.move({ from: { row: 4, column: 4 }, to: { row: 3, column: 3 } }),
      ).toBe('done');

      expect(game.board).toEqual([
        [null, dark, null, dark, null, dark, null, dark],
        [dark, null, dark, null, dark, null, dark, null],
        [null, dark, null, dark, null, dark, null, dark],
        [null, null, null, king, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [light, null, light, null, light, null, light, null],
        [null, light, null, light, null, light, null, light],
        [light, null, light, null, light, null, light, null],
      ]);

      game.currentColor = color;
      expect(
        game.move({ from: { row: 3, column: 3 }, to: { row: 2, column: 4 } }),
      ).toBe('done');

      expect(game.board).toEqual([
        [null, dark, null, dark, null, dark, null, dark],
        [dark, null, dark, null, dark, null, dark, null],
        [null, dark, null, dark, king, dark, null, dark],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [light, null, light, null, light, null, light, null],
        [null, light, null, light, null, light, null, light],
        [light, null, light, null, light, null, light, null],
      ]);

      game.currentColor = color;
      expect(
        game.move({ from: { row: 2, column: 4 }, to: { row: 3, column: 3 } }),
      ).toBe('done');

      expect(game.board).toEqual([
        [null, dark, null, dark, null, dark, null, dark],
        [dark, null, dark, null, dark, null, dark, null],
        [null, dark, null, dark, null, dark, null, dark],
        [null, null, null, king, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [light, null, light, null, light, null, light, null],
        [null, light, null, light, null, light, null, light],
        [light, null, light, null, light, null, light, null],
      ]);
    });
  }
});
