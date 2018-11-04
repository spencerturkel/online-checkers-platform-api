import {
  Color,
  dark,
  Game,
  light,
  lightKing,
  MoveRequest,
  Piece,
  darkKing,
} from './game';

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

  test('cannot move into occupied space', () => {
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

  test('cannot move more than one space', () => {
    expect(
      game.move({ from: { row: 5, column: 0 }, to: { row: 3, column: 2 } }),
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

  test('cannot move outside the board', () => {
    expect(
      game.move({ from: { row: 5, column: 0 }, to: { row: 4, column: -1 } }),
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

    expect(
      game.move({ from: { row: 6, column: 7 }, to: { row: 5, column: 8 } }),
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

    game.board[0][0] = light;
    expect(
      game.move({ from: { row: 0, column: 0 }, to: { row: -1, column: 1 } }),
    ).toBe(null);

    expect(game.board).toEqual([
      [light, dark, null, dark, null, dark, null, dark],
      [dark, null, dark, null, dark, null, dark, null],
      [null, dark, null, dark, null, dark, null, dark],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [light, null, light, null, light, null, light, null],
      [null, light, null, light, null, light, null, light],
      [light, null, light, null, light, null, light, null],
    ]);

    game.board[7][7] = dark;
    expect(
      game.move({ from: { row: 7, column: 7 }, to: { row: 8, column: 6 } }),
    ).toBe(null);

    expect(game.board).toEqual([
      [light, dark, null, dark, null, dark, null, dark],
      [dark, null, dark, null, dark, null, dark, null],
      [null, dark, null, dark, null, dark, null, dark],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [light, null, light, null, light, null, light, null],
      [null, light, null, light, null, light, null, light],
      [light, null, light, null, light, null, light, dark],
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

  test.each`
    move                                                          | dir
    ${{ from: { row: 5, column: 2 }, to: { row: 5, column: 1 } }} | ${'left'}
    ${{ from: { row: 5, column: 2 }, to: { row: 5, column: 3 } }} | ${'right'}
    ${{ from: { row: 5, column: 2 }, to: { row: 4, column: 2 } }} | ${'up'}
    ${{ from: { row: 5, column: 2 }, to: { row: 6, column: 2 } }} | ${'down'}
  `('cannot move $dir', ({ move }: { move: MoveRequest }) => {
    expect(game.move(move)).toBe(null);
  });

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

  test.each`
    colorName  | color
    ${'light'} | ${light}
    ${'dark'}  | ${dark}
  `(
    `$colorName kings may move forward and backward`,
    ({ color }: { color: Color }) => {
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
    },
  );
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

  test.each`
    color    | colorName  | move
    ${light} | ${'light'} | ${{ from: { row: 3, column: 2 }, to: { row: 2, column: 1 } }}
    ${dark}  | ${'dark'}  | ${{ from: { row: 1, column: 0 }, to: { row: 2, column: 1 } }}
  `(
    '$colorName must jump if possible',
    ({ color, move }: { color: Color; move: MoveRequest }) => {
      game.currentColor = color;
      expect(game.move(move)).toBe(null);
    },
  );

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

  test('light may win', () => {
    game.board = [
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      [null, dark, null, null, null, null, null, null],
      [light, null, null, null, null, null, null, null],
    ];

    expect(
      game.move({ from: { row: 7, column: 0 }, to: { row: 5, column: 2 } }),
    ).toBe('win');

    expect(game.board).toEqual([
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      [null, null, light, null, null, null, null, null],
      Array(8).fill(null),
      Array(8).fill(null),
    ]);
  });
  test('dark may jump light', () => {
    game.currentColor = dark;

    expect(
      game.move({ from: { row: 2, column: 5 }, to: { row: 4, column: 3 } }),
    ).toBe('done');

    expect(game.board).toEqual([
      [null, dark, null, dark, null, dark, null, dark],
      [dark, null, null, null, dark, null, null, null],
      [null, null, null, dark, null, null, null, dark],
      [null, null, light, null, null, null, null, null],
      [null, dark, null, dark, null, null, null, null],
      [light, null, light, null, dark, null, light, null],
      [null, light, null, null, null, light, null, light],
      [light, null, light, null, light, null, light, null],
    ]);
  });

  test('dark may win', () => {
    game.currentColor = dark;

    game.board = [
      [null, dark, null, null, null, null, null, null],
      [null, null, light, null, null, null, null, null],
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
    ];

    expect(
      game.move({ from: { row: 0, column: 1 }, to: { row: 2, column: 3 } }),
    ).toBe('win');

    expect(game.board).toEqual([
      Array(8).fill(null),
      Array(8).fill(null),
      [null, null, null, dark, null, null, null, null],
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
    ]);
  });
});

describe('promotion', () => {
  test('light move promotion', () => {
    game = new Game(light, 0, darkPlayer, lightPlayer, [
      Array(8).fill(null),
      [light, null, null, null, null, null, null, null],
      [dark, null, null, null, null, null, null, null],
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
    ]);

    expect(
      game.move({ from: { row: 1, column: 0 }, to: { row: 0, column: 1 } }),
    ).toBe('promoted');

    expect(game.board).toEqual([
      [null, lightKing, null, null, null, null, null, null],
      Array(8).fill(null),
      [dark, null, null, null, null, null, null, null],
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
    ]);
  });

  test('dark move promotion', () => {
    game = new Game(dark, 0, darkPlayer, lightPlayer, [
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      [dark, null, null, null, null, null, null, null],
      [light, null, null, null, null, null, null, null],
    ]);

    expect(
      game.move({ from: { row: 6, column: 0 }, to: { row: 7, column: 1 } }),
    ).toBe('promoted');

    expect(game.board).toEqual([
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      [light, darkKing, null, null, null, null, null, null],
    ]);
  });
});
