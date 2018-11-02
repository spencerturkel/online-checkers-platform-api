import { Color, dark, Game, light, lightKing, Piece } from './game';

const lightPlayer = 'p1';
const darkPlayer = 'p2';

let game: Game;

const colorsAndNames = [[light, 'light'], [dark, 'dark']] as Array<
  [Color, string]
>;

describe('basic moves', () => {
  beforeEach(() => {
    game = new Game(light, 0, lightPlayer, darkPlayer);
  });

  test('light moving into empty space', () => {
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

  test('cannot moving into occupied space', () => {
    expect(
      game.move({ from: { row: 7, column: 0 }, to: { row: 6, column: 1 } }),
    ).toBe(null);

    expect(game.board).toEqual([
      [null, dark, null, dark, null, dark, null, dark],
      [dark, null, dark, null, dark, null, dark, null],
      [null, dark, null, dark, null, dark, null, dark],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [light, null, light, null, light, null, light, null],
      [null, light, null, light, null, light, null, light],
      [light, null, light, null, light, null, light, null],
    ]);
  });

  test('light cannot move backwards', () => {
    const board = [
      [null, dark, null, dark, null, dark, null, dark],
      [dark, null, dark, null, dark, null, dark, null],
      [null, dark, null, dark, null, dark, null, dark],
      [null, null, null, null, null, null, null, null],
      [null, light, null, null, null, null, null, null],
      [null, null, light, null, light, null, light, null],
      [null, light, null, light, null, light, null, light],
      [light, null, light, null, light, null, light, null],
    ];

    game.board = board;

    expect(
      game.move({ from: { row: 4, column: 1 }, to: { row: 5, column: 0 } }),
    ).toBe(null);

    expect(game.board).toEqual(board);
  });

  test('dark cannot move backwards', () => {
    const board = [
      [null, dark, null, dark, null, dark, null, dark],
      [dark, null, dark, null, dark, null, dark, null],
      [null, null, null, dark, null, dark, null, dark],
      [dark, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [light, null, light, null, light, null, light, null],
      [null, light, null, light, null, light, null, light],
      [light, null, light, null, light, null, light, null],
    ];

    game.board = board;

    expect(
      game.move({ from: { row: 3, column: 0 }, to: { row: 2, column: 1 } }),
    ).toBe(null);

    expect(game.board).toEqual(board);
  });

  test('dark moving into empty space', () => {
    game.currentColor = dark;

    expect(
      game.move({ from: { row: 2, column: 1 }, to: { row: 3, column: 2 } }),
    ).toBe('done');

    expect(game.board).toEqual([
      [null, dark, null, dark, null, dark, null, dark],
      [dark, null, dark, null, dark, null, dark, null],
      [null, null, null, dark, null, dark, null, dark],
      [null, null, dark, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [light, null, light, null, light, null, light, null],
      [null, light, null, light, null, light, null, light],
      [light, null, light, null, light, null, light, null],
    ]);
  });

  for (const move of [
    { from: { row: 5, column: 2 }, to: { row: 5, column: 1 }, dir: 'left' },
    { from: { row: 5, column: 2 }, to: { row: 5, column: 3 }, dir: 'right' },
    { from: { row: 5, column: 2 }, to: { row: 4, column: 2 }, dir: 'down' },
    { from: { row: 5, column: 2 }, to: { row: 6, column: 2 }, dir: 'up' },
  ]) {
    test(`cannot move ${move.dir}`, () => {
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

  for (const [color, colorName] of colorsAndNames) {
    test(`${colorName} kings may move forward and backward`, () => {
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

describe('jumps', () => {
  beforeEach(() => {
    game = new Game(light, 0, darkPlayer, lightPlayer, [
      [null, dark, null, dark, null, dark, null, dark],
      [dark, null, null, null, dark, null, null, null],
      [null, null, null, dark, null, dark, null, dark],
      [null, null, light, null, light, null, null, null],
      [null, dark, null, null, null, null, null, null],
      [light, null, light, null, dark, null, light, null],
      [null, light, null, null, null, light, null, light],
      [light, null, light, null, light, null, light, null],
    ]);
  });

  test('light may jump dark', () => {
    expect(
      game.move({ from: { row: 3, column: 4 }, to: { row: 1, column: 6 } }),
    ).toBe('done');

    expect(game.board).toEqual([
      [null, dark, null, dark, null, dark, null, dark],
      [dark, null, null, null, dark, null, light, null],
      [null, null, null, dark, null, null, null, dark],
      [null, null, light, null, null, null, null, null],
      [null, dark, null, null, null, null, null, null],
      [light, null, light, null, dark, null, light, null],
      [null, light, null, null, null, light, null, light],
      [light, null, light, null, light, null, light, null],
    ]);
  });
});
