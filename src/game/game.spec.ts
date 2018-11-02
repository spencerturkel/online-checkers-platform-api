import { Game } from './game';

describe('Game moves', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game('p1', 0, 'p1', 'p2');
  });

  test('Player One moving into empty space', () => {
    expect(
      game.move(
        { from: { row: 5, column: 0 }, to: { row: 4, column: 1 } },
        'p1',
      ),
    ).toBe('done');

    expect(game.board).toEqual([
      [null, 'B', null, 'B', null, 'B', null, 'B'],
      ['B', null, 'B', null, 'B', null, 'B', null],
      [null, 'B', null, 'B', null, 'B', null, 'B'],
      [null, null, null, null, null, null, null, null],
      [null, 'R', null, null, null, null, null, null],
      [null, null, 'R', null, 'R', null, 'R', null],
      [null, 'R', null, 'R', null, 'R', null, 'R'],
      ['R', null, 'R', null, 'R', null, 'R', null],
    ]);
  });
  test('Backward move', () => {
    expect(
      game.move(
        { from: { row: 4, column: 1 }, to: { row: 5, column: 0 } },
        'p1',
      ),
    ).toBe(null);
  });
  test('Left Move', () => {
    expect(
      game.move(
        { from: { row: 5, column: 2 }, to: { row: 5, column: 1 } },
        'p1',
      ),
    ).toBe(null);
  });
});
