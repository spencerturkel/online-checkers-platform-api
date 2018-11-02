import { dark, Game, light } from './game';

describe('Game moves', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game(light, 0, 'p1', 'p2');
  });

  test('Player One moving into empty space', () => {
    expect(
      game.move(
        { from: { row: 5, column: 0 }, to: { row: 4, column: 1 } },
        'p1',
      ),
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
      expect(game.move(move, 'p1')).toBe(null);
    });
  }
});
