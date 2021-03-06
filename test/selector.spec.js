import { describe, it } from 'mocha';
import expect from 'expect';
import Immutable from 'immutable';
import { createSelector } from 'reselect';

import { initialReducerState } from '../src/ReduxWPAPI';
import { selectRequest, selectRequestRaw, selectQuery, withDenormalize } from '../src/selectors';
import { pending, resolved } from '../src/constants/requestStatus';

describe('Selector selectQuery', () => {
  it('should warn the deprecation of selectQuery', () => {
    const spyWarn = expect.spyOn(console, 'warn');
    selectQuery('name');
    expect(spyWarn).toHaveBeenCalled();
    spyWarn.restore();
  });
});

describe('Selector selectRequestRaw', () => {
  it('should throw when Request is not Identifiable', () => {
    expect(() => {
      selectRequestRaw();
    }).toThrow();

    expect(() => {
      selectRequestRaw({});
    }).toThrow();
  });

  it('should return a Request for empty state', () => {
    const state = { wp: initialReducerState };
    expect(selectRequestRaw('test')(state))
    .toEqual({
      status: pending,
      error: false,
      data: false,
    });
  });

  it('should return a Request for pending state', () => {
    const cacheID = 'test/';
    const queryState = { status: pending, error: false, requestAt: Date.now(), operation: 'get' };
    const state = {
      wp: (
        initialReducerState
        .mergeIn(['requestsByName', 'test'], { cacheID, page: 1 })
        .setIn(['requestsByQuery', 'test/', 1], queryState)
      ),
    };
    expect(selectRequestRaw('test')(state))
    .toEqual({
      status: pending,
      operation: queryState.operation,
      requestAt: queryState.requestAt,
      cacheID,
      error: false,
      data: false,
      page: 1,
    });
  });

  it('should return a Request by cacheID + page', () => {
    const resource = { id: 1, title: 'lol' };
    const cacheID = 'test/';
    const queryState = {
      status: resolved,
      error: false,
      requestAt: Date.now(),
      operation: 'get',
      data: [0],
    };
    const state = {
      wp: (
        initialReducerState
        .setIn(['resources', 0], resource)
        .mergeIn(['requestsByName', 'test'], { cacheID, page: 1 })
        .setIn(['requestsByQuery', 'test/', 1], queryState)
      ),
    };

    const selector = selectRequestRaw({ cacheID: 'test/', page: 1 });
    const selectedState = selector(state);

    expect(selectedState)
    .toEqual({
      status: resolved,
      operation: queryState.operation,
      requestAt: queryState.requestAt,
      cacheID,
      error: false,
      page: 1,
      data: [0],
    });
  });

  it('should refer to same objects between two selections with same input state', () => {
    const resource = { id: 1, title: 'lol' };
    const cacheID = 'test/';
    const queryState = {
      status: resolved,
      error: false,
      requestAt: Date.now(),
      operation: 'get',
      data: [0],
    };
    const state = {
      wp: (
        initialReducerState
        .setIn(['resources', 0], resource)
        .mergeIn(['requestsByName', 'test'], { cacheID, page: 1 })
        .setIn(['requestsByQuery', 'test/', 1], queryState)
      ),
    };

    const selector = selectRequestRaw('test');
    const selectedState = selector(state);
    expect(selector(state)).toBe(selectedState);
  });
});

describe('Selector selectRequest', () => {
  it('should return a Request for empty state', () => {
    const state = { wp: initialReducerState };
    expect(selectRequest('test')(state))
    .toEqual({
      status: pending,
      error: false,
      data: false,
    });
    expect(selectRequest('test')(state))
    .toEqual({
      status: pending,
      error: false,
      data: false,
    });
  });

  it('should return a Request for pending state', () => {
    const cacheID = 'test/';
    const queryState = { status: pending, error: false, requestAt: Date.now(), operation: 'get' };
    const state = {
      wp: (
        initialReducerState
        .mergeIn(['requestsByName', 'test'], { cacheID, page: 1 })
        .setIn(['requestsByQuery', 'test/', 1], queryState)
      ),
    };
    expect(selectRequest('test')(state))
    .toEqual({
      status: pending,
      operation: queryState.operation,
      requestAt: queryState.requestAt,
      cacheID,
      error: false,
      data: false,
      page: 1,
    });
  });

  it('should return a Request by cacheID + page', () => {
    const resource = { id: 1, title: 'lol' };
    const cacheID = 'test/';
    const queryState = {
      status: resolved,
      error: false,
      requestAt: Date.now(),
      operation: 'get',
      data: [0],
    };
    const state = {
      wp: (
        initialReducerState
        .setIn(['resources', 0], resource)
        .mergeIn(['requestsByName', 'test'], { cacheID, page: 1 })
        .setIn(['requestsByQuery', 'test/', 1], queryState)
      ),
    };

    const selector = selectRequest({ cacheID: 'test/', page: 1 });
    const selectedState = selector(state);

    expect(selectedState)
    .toContain({
      status: resolved,
      operation: queryState.operation,
      requestAt: queryState.requestAt,
      cacheID,
      error: false,
      page: 1,
    });

    expect(selectedState.data).toBeAn('array');
    expect(selectedState.data[0]).toEqual(resource);
  });

  it('should return a Request for resolved state without embedded', () => {
    const resource = { id: 1, title: 'lol' };
    const cacheID = 'test/';
    const queryState = {
      status: resolved,
      error: false,
      requestAt: Date.now(),
      operation: 'get',
      data: [0],
    };
    const state = {
      wp: (
        initialReducerState
        .setIn(['resources', 0], resource)
        .mergeIn(['requestsByName', 'test'], { cacheID, page: 1 })
        .setIn(['requestsByQuery', 'test/', 1], queryState)
      ),
    };

    const selector = selectRequest('test');
    const selectedState = selector(state);

    expect(selectedState)
    .toContain({
      status: resolved,
      operation: queryState.operation,
      requestAt: queryState.requestAt,
      cacheID,
      error: false,
      page: 1,
    });

    expect(selectedState.data).toBeAn('array');
    expect(selectedState.data[0]).toEqual(resource);
  });

  it('should return a Request for resolved state with embedded', () => {
    const resources = [
      { id: 1,
        title: 'lol',
        _links: { parent: { url: 'http://dumb.com/test/2' } },
        _embedded: { parent: 1 },
      },
      { id: 2, title: 'lol 2' },
    ];
    const cacheID = 'test/';
    const queryState = {
      status: resolved,
      error: false,
      requestAt: Date.now(),
      operation: 'get',
      data: [0],
    };
    const state = {
      wp: (
        initialReducerState
        .setIn(['resources'], new Immutable.List(resources))
        .mergeIn(['requestsByName', 'test'], { cacheID, page: 1 })
        .setIn(['requestsByQuery', 'test/', 1], queryState)
      ),
    };

    const selector = selectRequest('test');
    const selectedState = selector(state);
    expect(selectedState)
    .toContain({
      status: resolved,
      operation: queryState.operation,
      requestAt: queryState.requestAt,
      cacheID,
      error: false,
      page: 1,
    });

    expect(selectedState.data).toBeAn('array');
    expect(selectedState.data[0]).toInclude(resources[0]);
    expect(selectedState.data[0].parent).toInclude(resources[1]);
  });

  it('should refer to same objects between two selections with same input state', () => {
    const resource = { id: 1, title: 'lol' };
    const cacheID = 'test/';
    const queryState = {
      status: resolved,
      error: false,
      requestAt: Date.now(),
      operation: 'get',
      data: [0],
    };
    const state = {
      wp: (
        initialReducerState
        .setIn(['resources', 0], resource)
        .mergeIn(['requestsByName', 'test'], { cacheID, page: 1 })
        .setIn(['requestsByQuery', 'test/', 1], queryState)
      ),
    };

    const selector = selectRequest('test');
    const selectedState = selector(state);
    expect(selector(state)).toBe(selectedState);
  });
});


describe('withDenormalize', () => {
  it('should allow consumers to denormalize resources by local ids within selector', () => {
    const resources = [
      { id: 1,
        title: 'lol',
        _links: { parent: { url: 'http://dumb.com/test/2' } },
        _embedded: { parent: 1 },
      },
      { id: 2, title: 'lol 2' },
    ];
    const storeState = {
      wp: (
        initialReducerState
        .setIn(['resources'], new Immutable.List(resources))
      ),
    };

    const selector = withDenormalize(
      createSelector(
        () => 1,
        id => denormalize => denormalize(id)
      )
    );
    const selectedState = selector(storeState);
    expect(selectedState).toInclude(resources[1]);
  });
});
